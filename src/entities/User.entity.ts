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

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

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
