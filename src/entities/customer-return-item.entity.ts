import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Product } from './product.entity';
import { CustomerReturn } from './customer-return.entity';

@Entity('customer_return_items')
@Index(['customerReturnId', 'productId'], { unique: false })
export class CustomerReturnItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerReturn, (ret) => ret.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_return_id' })
  customerReturn: CustomerReturn;

  @Index()
  @Column({ name: 'customer_return_id' })
  customerReturnId: number;

  @ManyToOne(() => Product, (product) => product.customerReturnItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Index()
  @Column({ name: 'product_id' })
  productId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;
}
