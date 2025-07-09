import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
// import { ExpenseCategory } from './expense-category.entity'; // optionnel

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, (store) => store.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id' })
  storeId: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => StoreUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: StoreUser;

  @Index()
  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
