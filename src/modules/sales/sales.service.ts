import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from 'src/entities/cash-register-session.entity';
import {
  InventoryMovement,
  InventoryMovementType,
  InventorySourceType,
} from 'src/entities/inventory-movement.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { Payment } from 'src/entities/payment.entity';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { Receipt, ReceiptType } from 'src/entities/sale-receipt.entity';
import { Sale, SaleStatus } from 'src/entities/sale.entity';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { Repository, DataSource, Between } from 'typeorm';
import { CreateSaleDto } from './dto/sale-dto';
import { plainToInstance } from 'class-transformer';
import { SaleDto } from './dto/saleReturnDto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepository: Repository<CashRegisterSession>,
    @InjectRepository(StoreUser)
    private readonly storeUserRepository: Repository<StoreUser>,
    private readonly dataSource: DataSource,
    private readonly requestContextService: RequestContextService,
  ) {}

  private validateStoreContext(storeId: number) {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);

    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Access denied. You can only access resources from your current store.',
      });
    }
    return contextStoreId;
  }

  /**
   * Enregistre une nouvelle vente complète avec ses articles, paiements et mises à jour de stock.
   * @param createSaleDto Les données de la vente.
   * @returns La vente enregistrée et le contenu du reçu.
   */
  async createSale(
    createSaleDto: CreateSaleDto,
    urlStoreId: number,
  ): Promise<{ sale: SaleDto; receiptContent: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { cashRegisterSessionId, saleItems, payments, discountAmount = 0 } = createSaleDto;

      const { storeUserId: createdByStoreUserId } = this.requestContextService.getContext();

      if (!createdByStoreUserId) throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);

      const storeId = this.validateStoreContext(urlStoreId);

      // 1. Vérifications Préalables
      const storeUser = await queryRunner.manager.findOne(StoreUser, {
        where: { id: createdByStoreUserId, storeId: storeId, status: StoreUserStatus.ACTIVE },
        relations: ['user', 'store'],
      });
      if (!storeUser) {
        throw new NotFoundException(
          `StoreUser ${createdByStoreUserId} ou magasin ${storeId} introuvable ou inactif.`,
        );
      }

      const cashSession = await queryRunner.manager.findOne(CashRegisterSession, {
        where: { id: cashRegisterSessionId, status: CashRegisterSessionStatus.OPEN },
        relations: ['cashRegister'], // Pour s'assurer qu'elle appartient au bon magasin
      });
      if (!cashSession || cashSession.cashRegister.storeId !== storeId) {
        throw new BadRequestException(`Session de caisse invalide ou non ouverte pour le magasin.`);
      }

      // 2. Calcul du Montant Total de la Vente et Vérification des Stocks
      let totalSaleAmount = 0;
      const createdSaleItems: SaleItem[] = [];
      const inventoryMovements: InventoryMovement[] = [];

      for (const itemDto of saleItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId, storeId: storeId, isActive: true },
        });
        if (!product) {
          throw new NotFoundException(
            `Produit avec ID ${itemDto.productId} introuvable ou inactif dans ce magasin.`,
          );
        }
        if (product.quantityInStock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour le produit ${product.name}. Disponible: ${product.quantityInStock}, Requis: ${itemDto.quantity}`,
          );
        }

        const itemSubTotal = product.sellingPrice * itemDto.quantity;
        const itemDiscount = itemDto.itemDiscount || 0; // Remise sur l'article
        const finalItemPrice = itemSubTotal - itemDiscount;

        totalSaleAmount += finalItemPrice;

        // Créer l'article de vente
        createdSaleItems.push(
          queryRunner.manager.create(SaleItem, {
            product: product,
            productId: product.id,
            productName: product.name,
            unitPrice: product.sellingPrice,
            quantity: itemDto.quantity,
            originalPrice: itemSubTotal,
            totalPrice: finalItemPrice,
            discountPercentage: itemDiscount,
          }),
        );

        // Préparer le mouvement de stock
        inventoryMovements.push(
          queryRunner.manager.create(InventoryMovement, {
            storeId,
            product: product,
            productId: product.id,
            type: 'OUT',
            sourceType: InventorySourceType.SALE,
            quantity: itemDto.quantity,
            movementType: InventoryMovementType.SALE,
            reason: `Vente effectuée par ${storeUser.user.fullName} (${storeUser.id})`,
            createdBy: storeUser,
            createdById: storeUser.id,
          }),
        );

        // Mettre à jour le stock du produit (dans la même transaction)
        product.quantityInStock -= itemDto.quantity;
        await queryRunner.manager.save(Product, product);
      }

      totalSaleAmount -= discountAmount; // Appliquer la remise globale sur la vente

      if (totalSaleAmount < 0) {
        throw new BadRequestException(
          'Le montant total de la vente ne peut pas être négatif après les remises.',
        );
      }

      // 3. Calcul et Vérification des Paiements
      let totalPaidAmount = 0;
      const createdSalePayments: Payment[] = [];

      for (const paymentDto of payments) {
        const paymentMethod = await queryRunner.manager.findOne(PaymentMethod, {
          where: { id: paymentDto.paymentMethodId, storeId: storeId, isActive: true },
        });
        if (!paymentMethod) {
          throw new NotFoundException(
            `Méthode de paiement avec ID ${paymentDto.paymentMethodId} introuvable ou inactive.`,
          );
        }
        if (paymentDto.amount <= 0) {
          throw new BadRequestException(
            `Le montant du paiement pour la méthode ${paymentMethod.name} doit être positif.`,
          );
        }

        totalPaidAmount += paymentDto.amount;

        createdSalePayments.push(
          queryRunner.manager.create(Payment, {
            paymentMethod: paymentMethod,
            paymentMethodId: paymentMethod.id,
            amount: paymentDto.amount,
            transactionReference: paymentDto.transactionReference,
            processedBy: storeUser,
            processedByStoreUserId: storeUser.id,
          }),
        );
      }

      // Vérifier si le montant payé est suffisant
      if (totalPaidAmount < totalSaleAmount) {
        throw new BadRequestException(
          `Montant insuffisant. Total de la vente: ${totalSaleAmount}, Montant payé: ${totalPaidAmount}.`,
        );
      }

      const changeDue = totalPaidAmount - totalSaleAmount;

      // 4. Créer et Enregistrer la Vente
      const newSale = queryRunner.manager.create(Sale, {
        store: { id: storeId },
        cashRegisterSession: { id: cashRegisterSessionId },
        createdBy: storeUser,
        createdByStoreUserId: storeUser.id,
        saleNumber: await this.generateUniqueSaleNumber(storeId),
        totalAmount: totalSaleAmount,
        totalPaidAmount: totalPaidAmount,
        changeDue: changeDue,
        discount: discountAmount,
        status: SaleStatus.COMPLETED,
        saleItems: createdSaleItems,
        payments: createdSalePayments,
      });

      const savedSale = await queryRunner.manager.save(Sale, newSale);

      // 5. Enregistrer les Mouvements d'Inventaire
      for (const movement of inventoryMovements) {
        movement.sourceId = savedSale.id;
        await queryRunner.manager.save(InventoryMovement, movement);
      }

      // 6. Générer et Enregistrer le Reçu
      const receiptContent = this.generateReceiptContent(
        savedSale,
        storeUser,
        cashSession,
        changeDue,
      );
      const newReceipt = queryRunner.manager.create(Receipt, {
        sale: savedSale,
        saleId: savedSale.id,
        store: { id: storeId },
        storeId: storeId,
        receiptNumber: savedSale.saleNumber,
        type: ReceiptType.ORIGINAL,
        content: receiptContent,
      });
      await queryRunner.manager.save(Receipt, newReceipt);

      await queryRunner.commitTransaction();
      // Supposons que `savedSale` est ton entité complète TypeORM
      const saleResponse = plainToInstance(SaleDto, savedSale, {
        excludeExtraneousValues: true,
      });

      return {
        sale: saleResponse,
        receiptContent: receiptContent,
      };

      // Retourner la vente et le contenu du reçu pour l'impression
      // return { sale: savedSale, receiptContent: receiptContent };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Fonctions utilitaires ---

  private async generateUniqueSaleNumber(storeId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    const dayNumber = today.getDate(); // 1-31
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = dayNumber.toString().padStart(2, '0');

    const lastSale = await this.saleRepository.findOne({
      where: {
        storeId: storeId,
        createdAt: Between(
          new Date(year, month, dayNumber, 0, 0, 0),
          new Date(year, month, dayNumber, 23, 59, 59),
        ),
      },
      order: { id: 'DESC' },
    });

    let sequence = 1;
    const datePrefix = `${year}${monthStr}${dayStr}`;

    if (lastSale?.saleNumber) {
      const parts = lastSale.saleNumber.split('-');
      if (parts.length === 3 && parts[1] === datePrefix) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    return `S-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
  }

  private generateReceiptContent(
    sale: Sale,
    storeUser: StoreUser,
    cashSession: CashRegisterSession,
    changeDue: number,
  ): string {
    let content = `
    --- RECU DE VENTE ---
    Magasin: ${storeUser.store.name}
    Caisse: ${cashSession.cashRegister.name} (Session ID: ${cashSession.id})
    Vendeur: ${storeUser.user.fullName}
    Date: ${sale.createdAt.toLocaleString()}
    Numéro de vente: ${sale.saleNumber}
    --------------------
    Articles achetés:
    `;

    sale.saleItems.forEach((item) => {
      const unitPrice = Number(item.unitPrice);
      const totalPrice = Number(item.totalPrice);
      const discount = Number(item.discountPercentage);

      content += `
  - ${item.productName} (x${item.quantity}) @ ${unitPrice.toFixed(2)} = ${totalPrice.toFixed(2)}
  `;
      if (discount > 0) {
        content += `  (Remise article: -${discount.toFixed(2)})`;
      }
    });

    content += `
    --------------------
    Montant Total: ${Number(Number(sale.totalAmount) + Number(sale.discount)).toFixed(2)}
    Remise Globale: -${Number(sale.discount).toFixed(2)}
    Montant Net à Payer: ${Number(Number(sale.totalAmount))}
    --------------------
    Paiements:
    `;

    sale.payments.forEach((payment) => {
      content += `
      - ${payment.paymentMethod.name}: ${Number(payment.amount).toFixed(2)} ${payment.transactionReference ? `(Ref: ${payment.transactionReference})` : ''}
      `;
    });

    content += `
    --------------------
    Montant Payé: ${Number(sale.totalPaidAmount).toFixed(2)}
    Monnaie à rendre: ${Number(changeDue).toFixed(2)}
    --------------------
    Merci de votre visite!
    `;

    return content;
  }

  /**
   * Récupère une vente par son ID.
   * @param saleId L'ID de la vente.
   * @returns La vente trouvée avec ses relations.
   */
  async findOne(saleId: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: [
        'saleItems',
        'payments.paymentMethod',
        'createdBy.user',
        'cashRegisterSession.cashRegister',
        'store',
        'receipts',
      ],
    });
    if (!sale) {
      throw new NotFoundException(`Vente avec ID ${saleId} introuvable.`);
    }
    return sale;
  }

  /**
   * Récupère toutes les ventes pour un magasin donné.
   * @param storeId L'ID du magasin.
   * @returns Liste des ventes.
   */
  async findAllForStore(storeId: number): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { storeId: storeId },
      relations: ['createdBy.user', 'cashRegisterSession.cashRegister', 'payments.paymentMethod'],
      order: { createdAt: 'DESC' },
    });
  }
}
