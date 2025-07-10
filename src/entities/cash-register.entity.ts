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
import { CashRegisterSession } from './cash-register-session.entity';

@Entity('cash_registers')
@Index(['name', 'storeId'], { unique: true }) // Évite les doublons de nom dans une même boutique
export class CashRegister {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Store, (store) => store.cashRegisters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => CashRegisterSession, (session) => session.cashRegister)
  cashRegisterSessions: CashRegisterSession[];
}
