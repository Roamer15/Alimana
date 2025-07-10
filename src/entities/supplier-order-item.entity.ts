import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SupplierOrders } from './supplier-order.entity';
import { Product } from './product.entity';

@Entity('supplier_order_items')
@Index(['supplierOrderId', 'productId'], { unique: true }) // Prevents duplicate
export class SupplierOrderItems {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SupplierOrders, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_order_id' })
  supplier_order: SupplierOrders;

  @Column({ name: 'supplier_order_id' })
  supplierOrderId: number;

  @ManyToOne(() => Product, (product) => product.supplierOrderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  receivedQuantity: number;
}
