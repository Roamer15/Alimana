import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { Product } from './product.entity';
import { StoreUser } from './store-user.entity';
import { InventoryMovementItem } from './inventory-movement-item.entity';

export enum InventoryMovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export enum InventorySourceType {
  SALE = 'SALE',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  DAMAGE_REPORT = 'DAMAGE_REPORT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Index()
  @Column()
  productId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'enum', enum: ['IN', 'OUT'] })
  type: 'IN' | 'OUT';

  @Column({ type: 'enum', enum: InventoryMovementType })
  movementType: InventoryMovementType;

  @Column({ type: 'int', nullable: true })
  sourceId: number | null;

  @Column({ type: 'enum', enum: InventorySourceType, nullable: true })
  sourceType: InventorySourceType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => StoreUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: StoreUser | null;

  @Column({ nullable: true })
  createById: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => InventoryMovementItem, (item) => item.inventoryMovement, { cascade: true })
  items: InventoryMovementItem[];
}
