import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sale } from './sale.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Index()
  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Index()
  @Column()
  paymentMethodId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionReference: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'], default: 'completed' })
  status: 'pending' | 'completed' | 'failed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
