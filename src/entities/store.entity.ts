import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { StoreUser } from './store-user.entity';
import { Sale } from './sale.entity';
import { Role } from './role.entity';
import { Expense } from './expenses.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { StoreSetting } from './store-setting.entity';
import { AuditLog } from './audit-logs.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { Supplier } from './supplier.entity';
import { SupplierOrders } from './supplier-order.entity';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { CustomerReturn } from './customer-return.entity';
import { DamagedOrExpiredReport } from './damaged-or-expired-report.entity';
import { PaymentMethod } from './payment-method.entity';
import { CashRegister } from './cash-register.entity';
import { Invitation } from './invitation.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relation : utilisateurs (employés/admins) qui travaillent dans cette boutique
  @OneToMany(() => StoreUser, (storeUser) => storeUser.store)
  storeUsers: StoreUser[];

  // Relation inverse avec les méthodes de paiement
  @OneToMany(() => PaymentMethod, (method) => method.store)
  paymentMethods: PaymentMethod[];

  // Relation vers Category
  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];

  // Liste des rôles (employés/admins) rattachés à cette boutique.
  // Un magasin peut avoir plusieurs rôles définis.
  @OneToMany(() => Role, (role) => role.store)
  roles: Role[];

  // Relation : ventes réalisées dans cette boutique
  @OneToMany(() => Sale, (sale) => sale.store)
  sales: Sale[];

  // Relation : dépenses enregistrées dans cette boutique
  @OneToMany(() => Expense, (expense) => expense.store)
  expenses: Expense[];

  // Relation : sessions de caisse ouvertes dans cette boutique
  @OneToMany(() => CashRegisterSession, (session) => session.store)
  cashRegisterSessions: CashRegisterSession[];

  // Relation : paramètres spécifiques de la boutique (configuration)
  @OneToMany(() => StoreSetting, (setting) => setting.store, { cascade: true })
  settings: StoreSetting[];

  // Relation : logs d’audit liés à cette boutique
  @OneToMany(() => AuditLog, (auditLog) => auditLog.store)
  auditLogs: AuditLog[];

  // Relation : mouvements d’inventaire liés à cette boutique (entrée, sortie, ajustement)
  @OneToMany(() => InventoryMovement, (inventoryMovement) => inventoryMovement.store)
  inventoryMovements: InventoryMovement[];

  // Relation : fournisseurs liés à cette boutique
  @OneToMany(() => Supplier, (supplier) => supplier.store)
  suppliers: Supplier[];

  // Relation : commandes passées par la boutique
  @OneToMany(() => SupplierOrders, (supplierOrders) => supplierOrders.store)
  supplierOrders: SupplierOrders[];

  // Relation : produits liés à cette boutique
  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  // Relation : retours clients effectués dans cette boutique
  @OneToMany(() => CustomerReturn, (customerReturn) => customerReturn.store)
  customerReturns: CustomerReturn[];

  // Relation : toutes les caise de vente disponible dans cette boutique
  @OneToMany(() => CashRegister, (cashRegister) => cashRegister.store)
  cashRegisters: CashRegister[];

  // Relation : sortir des produit deffectuer ou perimer  effectués dans cette boutique
  @OneToMany(() => DamagedOrExpiredReport, (report) => report.store)
  damagedOrExpiredReports: DamagedOrExpiredReport[];

  //invitation envoyer par cette boutique
  @OneToMany(() => Invitation, (invitation) => invitation.store)
  invitations: Invitation[];
  purchasesupplierOrderss: any;
}
