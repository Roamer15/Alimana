import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { Sale } from './sale.entity';
// import { Expense } from './expenses.entity';
import { CashRegister } from './cash-register.entity';

export enum CashRegisterSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Entity('cash_register_sessions')
export class CashRegisterSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  storeId: number;

  @Index()
  @ManyToOne(() => StoreUser, (user) => user.cashRegisterSessions)
  @JoinColumn({ name: 'store_user_id' })
  createdBy: StoreUser;

  @Column()
  storeUserId: number;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initialCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingCash: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  systemCashTotal: number | null;

  @Column({
    type: 'enum',
    enum: CashRegisterSessionStatus,
    default: CashRegisterSessionStatus.OPEN,
  })
  status: CashRegisterSessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Sale, (sale) => sale.cashRegisterSession)
  sales: Sale[];

  // @OneToMany(() => Expense, (expense) => expense.cashRegisterSession)
  // expenses: Expense[];

  @ManyToOne(() => CashRegister, (cashRegister) => cashRegister.cashRegisterSessions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

  @Column({ name: 'cash_register_id', nullable: true })
  cashRegisterId: number;
}
