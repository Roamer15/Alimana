import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { Sale } from './sale.entity';
import { StoreUser } from './store-user.entity';
import { CustomerReturnItem } from './customer-return-item.entity';

export enum ReturnStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

@Entity('customer_returns')
export class CustomerReturn {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, (store) => store.customerReturns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => Sale, (sale) => sale.returns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Index()
  @Column()
  saleId: number;

  @ManyToOne(() => StoreUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by_id' })
  processedBy: StoreUser;

  @Index()
  @Column({ name: 'processed_by_id', nullable: true })
  processedById: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalRefund: number;

  @Column('text')
  reason: string;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
  status: ReturnStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CustomerReturnItem, (item) => item.customerReturn, { cascade: true })
  items: CustomerReturnItem[];
}
