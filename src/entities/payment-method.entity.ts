import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { Store } from './store.entity';

export enum PaymentMethodType {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

@Entity('payment_methods')
@Index(['storeId', 'name'], { unique: true })
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  name: string; // ex: 'cash', 'card', 'mobile_money'

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  requiresReference?: boolean;

  @Index()
  @Column({ nullable: true })
  type: PaymentMethodType; // ex: 'Espèces'

  @Column({ default: false })
  isDefault: boolean; // ← Vrai si c’est une méthode par défaut

  @ManyToOne(() => Store, (store) => store.paymentMethods, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column()
  storeId: number;

  @OneToMany(() => Payment, (payment) => payment.paymentMethod)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
