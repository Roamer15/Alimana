import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { StoreUser } from './store-user.entity';
import { UserRefreshToken } from './user-refresh-token.entity';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider: AuthProvider;

  @Index()
  @Column({ nullable: true })
  lastSelectedStoreUserId: number;

  @Column({ type: 'varchar', nullable: true })
  providerId?: string; // ID reçu par Google, Facebook, etc.

  @Column({ type: 'boolean', default: false })
  @Index()
  canCreateStore: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => StoreUser, (storeUser) => storeUser.user)
  storeUsers: StoreUser[];

  @OneToMany(() => UserRefreshToken, (token) => token.user)
  refreshTokens: UserRefreshToken[];
}
