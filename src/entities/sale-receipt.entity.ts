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

  @OneToOne(() => Sale, (sale) => sale.receipt, {
    onDelete: 'SET NULL', // ou 'NO ACTION' selon besoin
  })
  @JoinColumn({ name: 'saleId' }) // colonne FK dans receipt
  sale: Sale;

  @Column({ nullable: true })
  saleId: number;

  @Column({ type: 'text', nullable: true })
  content: string; // HTML ou JSON formaté du reçu

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber: string; // numéro unique par boutique

  @CreateDateColumn()
  generatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
