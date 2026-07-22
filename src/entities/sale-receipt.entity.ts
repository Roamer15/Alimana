import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Store } from './store.entity';

export enum ReceiptType {
  ORIGINAL = 'original',
  DUPLICATE = 'duplicate',
  REFUND = 'refund',
  // etc.
}

@Entity('sale-receipts')
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.receipts, { onDelete: 'CASCADE' })
  sale: Sale;

  @Column()
  saleId: number;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  store: Store;

  @Column()
  storeId: number;

  @Column({ type: 'enum', enum: ReceiptType, default: ReceiptType.ORIGINAL })
  type: ReceiptType;

  @Column({ type: 'text', nullable: true })
  content: string; // HTML ou JSON formaté du reçu

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber: string; // numéro unique par boutique

  @CreateDateColumn()
  generatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
