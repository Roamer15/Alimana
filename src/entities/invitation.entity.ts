import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { Role } from './role.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @ManyToOne(() => Store, (store) => store.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: number;

  @ManyToOne(() => Role, (role) => role.invitations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => StoreUser, (storeUser) => storeUser.invitationsSent, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy: StoreUser;

  @Column({ name: 'invited_by_id' })
  invitedById: number;
}
