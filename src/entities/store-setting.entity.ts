import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';

export enum StoreSettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('store_settings')
@Index(['storeId', 'key'], { unique: true }) // Un store ne peut avoir deux fois la même clé
export class StoreSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, (store) => store.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id' })
  storeId: number;

  @Index()
  @Column({ length: 100 })
  key: string;

  @Column('text')
  value: string;

  @Column({ type: 'enum', enum: StoreSettingType })
  type: StoreSettingType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isEditable: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @ManyToOne(() => StoreUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: StoreUser;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: number;

  @ManyToOne(() => StoreUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: StoreUser;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
