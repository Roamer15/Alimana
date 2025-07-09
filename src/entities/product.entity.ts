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
import { Category } from './category.entity';
import { StoreUser } from './store-user.entity';
import { InventoryMovementItem } from './inventory-movement-item.entity';
import { SupplierOrderItems } from './supplier-order-item.entity';
import { SaleItem } from './sale-item.entity';
import { DamagedOrExpiredItem } from './damaged-or-expired-item.entity';
import { CustomerReturnItem } from './customer-return-item.entity';

@Entity('products')
@Index(['store', 'barcode'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  unit: string; // ex: kg, pcs, L...

  @Column('decimal', { precision: 10, scale: 2 })
  sellingPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercentage: number; // % de remise sur le prix original

  @Column({ type: 'int', default: 0 })
  quantityInStock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Index() // <- index applied on categoryId, to optimize filters
  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => StoreUser, { nullable: true })
  @JoinColumn({ name: 'created_by_id' }) // aligné avec le nom de la colonne
  createdBy: StoreUser;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id' })
  storeId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations métiers
  @OneToMany(() => InventoryMovementItem, (item) => item.product)
  inventoryMovementItems: InventoryMovementItem[];

  @OneToMany(() => SupplierOrderItems, (item) => item.product)
  supplierOrderItems: SupplierOrderItems[];

  @OneToMany(() => SaleItem, (item) => item.product)
  saleItems: SaleItem[];

  @OneToMany(() => CustomerReturnItem, (item) => item.product)
  customerReturnItems: CustomerReturnItem[];

  @OneToMany(() => DamagedOrExpiredItem, (item) => item.product)
  damagedItems: DamagedOrExpiredItem[];
}
