import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from './User.entity';

@Entity('user_refresh_tokens')
export class UserRefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column()
  userId: number;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string; // navigateur / device

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'revoked', type: 'boolean', default: false })
  revoked: boolean;
}
