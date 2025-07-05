import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sale } from './sale.entity';

@Entity('sale-receipts')
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Sale, (sale) => sale.receipt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  saleId: number;

  @Column({ type: 'text', nullable: true })
  content: string; // HTML ou JSON formaté du reçu

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber: string; // numéro unique par boutique

  @CreateDateColumn()
  generatedAt: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
