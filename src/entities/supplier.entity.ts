import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { SupplierOrders } from './supplier-order.entity';

@Entity('suppliers')
@Index(['storeId', 'name'], { unique: true }) // Empêche les doublons de nom dans une même boutique
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => SupplierOrders, (order) => order.supplier)
  supplierOrders: SupplierOrders[];

  @ManyToOne(() => Store, (store) => store.suppliers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @ManyToOne(() => StoreUser, (storeUser) => storeUser.suppliers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: StoreUser;

  @Index()
  @Column({ nullable: true })
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
