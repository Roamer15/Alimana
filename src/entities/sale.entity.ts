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
  OneToOne,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { SaleItem } from './sale-item.entity';
import { CustomerReturn } from './customer-return.entity';
import { Receipt } from './sale-receipt.entity';
import { Payment } from './payment.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, (store) => store.sales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => StoreUser, (user) => user.sales)
  @JoinColumn({ name: 'createdById' })
  createdBy: StoreUser;

  @Column()
  createdById: number;

  @ManyToOne(() => CashRegisterSession, (session) => session.sales, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cashSessionId' })
  cashRegisterSession: CashRegisterSession;

  @Column()
  cashRegisterSessionId: number;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  saleItems: SaleItem[];

  @OneToMany(() => CustomerReturn, (ret) => ret.sale)
  returns: CustomerReturn[];

  @OneToOne(() => Receipt, (receipt) => receipt.sale)
  receipt: Receipt;

  @OneToMany(() => Payment, (payment) => payment.sale)
  payments: Payment[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ default: false })
  isRefunded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
