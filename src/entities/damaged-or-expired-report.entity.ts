import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { DamagedOrExpiredItem } from './damaged-or-expired-item.entity';

export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('damaged_or_expired_reports')
export class DamagedOrExpiredReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @ManyToOne(() => StoreUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy: StoreUser;

  @Index()
  @Column({ name: 'reported_by_id', nullable: true })
  reportedById: number;

  @ManyToOne(() => StoreUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: StoreUser;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => DamagedOrExpiredItem, (item) => item.report, { cascade: true })
  items: DamagedOrExpiredItem[];
}
