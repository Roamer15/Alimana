import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  //Add other actions as needed
}

@Entity('audit_logs')
@Index(['actionType', 'entity', 'entityId', 'storeId', 'storeUserId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id', nullable: true })
  storeId: number | null;

  @ManyToOne(() => StoreUser, (user) => user.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_user_id' })
  storeUser: StoreUser;

  @Index()
  @Column({ name: 'store_user_id' })
  storeUserId: number;

  @Column({ type: 'enum', enum: AuditActionType })
  actionType: AuditActionType;

  @Index()
  @Column()
  entity: string; // ex: 'Product', 'Sale', etc.

  @Index()
  @Column()
  entityId: number;

  @Column({ type: 'json', nullable: true })
  oldValue: any;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  newValue: any;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;
}
