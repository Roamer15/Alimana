import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DamagedOrExpiredReport } from './damaged-or-expired-report.entity';
import { Product } from './product.entity';

@Entity('damaged_or_expired_items')
@Index(['reportId', 'productId'], { unique: false })
export class DamagedOrExpiredItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DamagedOrExpiredReport, (report) => report.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: DamagedOrExpiredReport;

  @Index()
  @Column({ name: 'report_id' })
  reportId: number;

  @ManyToOne(() => Product, (product) => product.damagedItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Index()
  @Column({ name: 'product_id' })
  productId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
