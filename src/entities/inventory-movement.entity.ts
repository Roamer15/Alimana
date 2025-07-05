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
  SALE = 'Sale',
  PURCHASE_ORDER = 'PurchaseOrder',
  CUSTOMER_RETURN = 'CustomerReturn',
  SUPPLIER_RETURN = 'SupplierReturn',
  DAMAGE_REPORT = 'DamageReport',
  MANUAL_ADJUSTMENT = 'ManualAdjustment',
  TRANSFER = 'Transfer',
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

  @ManyToOne(() => StoreUser, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: StoreUser;

  @Column()
  createById: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => InventoryMovementItem, (item) => item.inventoryMovement, { cascade: true })
  items: InventoryMovementItem[];
}
