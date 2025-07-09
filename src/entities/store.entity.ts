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
import { Sale } from './sale.entity';
import { Role } from './role.entity';
import { Expense } from './expenses.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { StoreSetting } from './store-setting.entity';
import { AuditLog } from './audit-logs.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { Supplier } from './supplier.entity';
import { SupplierOrders } from './supplier-order.entity';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { CustomerReturn } from './customer-return.entity';
import { DamagedOrExpiredReport } from './damaged-or-expired-report.entity';
import { PaymentMethod } from './payment-method.entity';
import { CashRegister } from './cash-register.entity';
import { Invitation } from './invitation.entity';
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

  // Relation: users (employees/admins) working in this store
  @OneToMany(() => StoreUser, (storeUser) => storeUser.store)
  storeUsers: StoreUser[];

  // Inverse relation with payment methods
  @OneToMany(() => PaymentMethod, (method) => method.store)
  paymentMethods: PaymentMethod[];

  // Relation to categories
  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];

  // List of roles (employees/admins) assigned to this store.
  // A store can have multiple defined roles.
  @OneToMany(() => Role, (role) => role.store)
  roles: Role[];

  // Relation: sales made in this store
  @OneToMany(() => Sale, (sale) => sale.store)
  sales: Sale[];

  // Relation: expenses recorded in this store
  @OneToMany(() => Expense, (expense) => expense.store)
  expenses: Expense[];

  // Relation: cash register sessions opened in this store
  @OneToMany(() => CashRegisterSession, (session) => session.store)
  cashRegisterSessions: CashRegisterSession[];

  // Relation: store-specific settings (configuration)
  @OneToMany(() => StoreSetting, (setting) => setting.store, { cascade: true })
  settings: StoreSetting[];

  // Relation: audit logs related to this store
  @OneToMany(() => AuditLog, (auditLog) => auditLog.store)
  auditLogs: AuditLog[];

  // Relation: inventory movements linked to this store (inbound, outbound, adjustments)
  @OneToMany(() => InventoryMovement, (inventoryMovement) => inventoryMovement.store)
  inventoryMovements: InventoryMovement[];

  // Relation: suppliers linked to this store
  @OneToMany(() => Supplier, (supplier) => supplier.store)
  suppliers: Supplier[];

  // Relation: orders placed by the store
  @OneToMany(() => SupplierOrders, (supplierOrders) => supplierOrders.store)
  supplierOrders: SupplierOrders[];

  // Relation: products linked to this store
  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  // Relation: customer returns processed in this store
  @OneToMany(() => CustomerReturn, (customerReturn) => customerReturn.store)
  customerReturns: CustomerReturn[];

  // Relation: all cash registers available in this store
  @OneToMany(() => CashRegister, (cashRegister) => cashRegister.store)
  cashRegisters: CashRegister[];

  // Relation: damaged or expired product reports made in this store
  @OneToMany(() => DamagedOrExpiredReport, (report) => report.store)
  damagedOrExpiredReports: DamagedOrExpiredReport[];

  // Invitations sent by this store
  @OneToMany(() => Invitation, (invitation) => invitation.store)
  invitations: Invitation[];

  // Assuming this is intended to represent purchase supplier orders linked to the store
  @OneToMany(() => SupplierOrders, (supplierOrders) => supplierOrders.store)
  purchaseSupplierOrders: SupplierOrders[];
}
