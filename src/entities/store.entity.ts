import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { StoreUser } from './store-user.entity';
import { Role } from './role.entity';
import { StoreSetting } from './store-setting.entity';
import { PaymentMethod } from './payment-method.entity';
import { CashRegister } from './cash-register.entity';
import { Category } from './category.entity';
import { Invitation } from './invitation.entity';

// Importations des entités pour les relations retirées ne sont plus nécessaires ici
// import { Sale } from './sale.entity';
// import { Expense } from './expenses.entity';
// import { CashRegisterSession } from './cash-register-session.entity';
// import { AuditLog } from './audit-logs.entity';
// import { InventoryMovement } from './inventory-movement.entity';
// import { Supplier } from './supplier.entity';
// import { SupplierOrders } from './supplier-order.entity';
// import { Product } from './product.entity';
// import { CustomerReturn } from './customer-return.entity';
// import { DamagedOrExpiredReport } from './damaged-or-expired-report.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- Relations Clés (conservées avec Lazy Loading) ---

  // Relation: users (employees/admins) working in this store
  @OneToMany(() => StoreUser, (storeUser) => storeUser.store, { lazy: true })
  storeUsers: Promise<StoreUser[]>;

  // Inverse relation with payment methods
  @OneToMany(() => PaymentMethod, (method) => method.store, { lazy: true })
  paymentMethods: Promise<PaymentMethod[]>;

  // Relation to categories (often store-specific)
  @OneToMany(() => Category, (category) => category.store, { lazy: true })
  categories: Promise<Category[]>;

  // List of roles defined for this store.
  @OneToMany(() => Role, (role) => role.store, { lazy: true })
  roles: Promise<Role[]>;

  // Relation: store-specific settings (configuration)
  @OneToMany(() => StoreSetting, (setting) => setting.store, { cascade: true, lazy: true })
  settings: Promise<StoreSetting[]>;

  // Relation: all cash registers available in this store
  @OneToMany(() => CashRegister, (cashRegister) => cashRegister.store, { lazy: true })
  cashRegisters: Promise<CashRegister[]>;

  // Invitations sent by this store
  @OneToMany(() => Invitation, (invitation) => invitation.store, { lazy: true })
  invitations: Promise<Invitation[]>;

  // --- Relations retirées (Accéder via les services ou dépôts dédiés) ---
  // sales, expenses, cashRegisterSessions, auditLogs, inventoryMovements,
  // suppliers, supplierOrders, products, customerReturns, damagedOrExpiredReports,
  // purchaseSupplierOrders (doublon de supplierOrders)
}
