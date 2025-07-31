import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { SaleItem } from './sale-item.entity';
import { CustomerReturn } from './customer-return.entity';
import { Receipt } from './sale-receipt.entity';
import { Payment } from './payment.entity';

export enum SaleStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => StoreUser, { onDelete: 'RESTRICT' })
  @JoinColumn()
  createdBy: StoreUser;

  @Index()
  @Column()
  createdById: number;

  @ManyToOne(() => CashRegisterSession, (session) => session.sales, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cash_register_session_id' }) // snake_case conseillé
  cashRegisterSession: CashRegisterSession;

  @Index()
  @Column({ name: 'cash_register_session_id', nullable: true })
  cashRegisterSessionId: number | null;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  saleItems: SaleItem[];

  @OneToMany(() => CustomerReturn, (ret) => ret.sale)
  returns: CustomerReturn[];

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  saleNumber: string; // Numéro de vente unique (ex: auto-généré S-20240717-0001

  @OneToMany(() => Receipt, (receipt) => receipt.sale, { cascade: true }) // cascade pour créer le reçu avec la vente
  receipts: Receipt[]; // Une vente peut avoir plusieurs reçus (original, duplicata, etc.)

  @OneToMany(() => Payment, (payment) => payment.sale, { cascade: true, eager: true })
  payments: Payment[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPaidAmount: number; // Montant total payé par le client (somme des SalePayment)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  changeDue: number; // Monnaie à rendre au client

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ default: false })
  isRefunded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
