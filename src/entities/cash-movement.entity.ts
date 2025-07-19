import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CashRegisterSession } from './cash-register-session.entity';
import { StoreUser } from './store-user.entity';
import { Store } from './store.entity';

export enum CashMovementType {
  IN = 'in', // Dépôt d'argent dans la caisse
  OUT = 'out', // Retrait d'argent de la caisse
}

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  storeId: number;

  @ManyToOne(() => CashRegisterSession, (session) => session.cashMovements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashRegisterSessionId' })
  cashRegisterSession: CashRegisterSession;

  @Column()
  cashRegisterSessionId: number;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => StoreUser, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByStoreUserId' })
  createdBy: StoreUser;

  @Column()
  createdByStoreUserId: number;

  @CreateDateColumn()
  createdAt: Date;
}
