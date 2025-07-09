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
import { Supplier } from './supplier.entity';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { SupplierOrderItems } from './supplier-order-item.entity';

export enum SupplierOrderStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('supplier_orders')
export class SupplierOrders {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.supplierOrders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

  @ManyToOne(() => StoreUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ordered_by_id' })
  orderedBy: StoreUser;

  @Index()
  @Column({ name: 'ordered_by_id', nullable: true })
  orderedById: number;

  @Column({ type: 'enum', enum: SupplierOrderStatus, default: SupplierOrderStatus.DRAFT })
  status: SupplierOrderStatus;

  @Column({ type: 'timestamp' })
  orderedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SupplierOrderItems, (item) => item.supplier_order, { cascade: true })
  items: SupplierOrderItems[];
}
