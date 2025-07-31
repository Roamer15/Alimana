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
import { CashRegister } from './cash-register.entity';
import { CashMovement } from './cash-movement.entity';

export enum CashRegisterSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Entity('cash_register_sessions')
export class CashRegisterSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @Index()
  @ManyToOne(() => StoreUser, (user) => user.cashRegisterSessions, { onDelete: 'RESTRICT' })
  openedBy: StoreUser;

  @Column()
  openedById: number;

  @ManyToOne(() => StoreUser, { nullable: true, onDelete: 'RESTRICT' })
  closedBy: StoreUser;

  @Index()
  @Column({ nullable: true })
  closedById: number;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  initialCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingCash: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedCash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discrepancy: number;

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

  @OneToMany(() => Sale, (sale) => sale.cashRegisterSession, { lazy: true })
  sales: Promise<Sale[]>;

  @OneToMany(() => CashMovement, (movement) => movement.cashRegisterSession, { lazy: true })
  cashMovements: Promise<CashMovement[]>;

  @ManyToOne(() => CashRegister, (cashRegister) => cashRegister.cashRegisterSessions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

  @Index()
  @Column({ name: 'cash_register_id', nullable: true })
  cashRegisterId: number;
}
