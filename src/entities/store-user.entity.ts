import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { User } from './User.entity';
import { Store } from './store.entity';
import { Role } from './role.entity';
import { Invitation } from './invitation.entity';
import { AuditLog } from './audit-logs.entity';
import { CashRegisterSession } from './cash-register-session.entity';
// Removed direct imports for Sale, Expense, InventoryMovement, etc.,
// as their OneToMany relationships are being removed from StoreUser directly.
// These entities will still exist and be managed by their own services/repositories.

// Possible status of a user in a store
export enum StoreUserStatus {
  PENDING = 'pending', // Invitation pending or user not yet active
  ACTIVE = 'active', // Active user in the store
  SUSPENDED = 'suspended', // Access suspended
}

@Entity('store_users')
export class StoreUser {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier

  // General user (from the Users table) linked to this store entry
  @ManyToOne(() => User, (user) => user.storeUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @Column()
  userId: number;

  // Store this user belongs to
  @ManyToOne(() => Store, (store) => store.storeUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  @Index()
  store: Store;

  @Column()
  storeId: number;

  // Role of the user within the store (admin, cashier, etc.)
  @ManyToOne(() => Role, (role) => role.storeUsers, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  roleId: number;

  // Activity status of the user in this store
  @Column({ type: 'enum', enum: StoreUserStatus, default: StoreUserStatus.PENDING })
  status: StoreUserStatus;

  // Effective date of joining the store (e.g., after accepting an invitation)
  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date; // Date when this relation was created

  @UpdateDateColumn()
  updatedAt: Date; // Date of last update

  // --- Relations secondaires conservées avec chargement paresseux ---

  /** Invitations sent by this user to others */
  @OneToMany(() => Invitation, (invitation) => invitation.invitedBy, { lazy: true })
  invitationsSent: Promise<Invitation[]>; // Use Promise with lazy loading

  /** Actions performed by the user recorded in audit logs */
  @OneToMany(() => AuditLog, (log) => log.storeUser, { lazy: true })
  auditLogs: Promise<AuditLog[]>; // Use Promise with lazy loading

  /** Cash register sessions opened or closed by this user */
  @OneToMany(() => CashRegisterSession, (session) => session.createdBy, { lazy: true })
  cashRegisterSessions: Promise<CashRegisterSession[]>; // Use Promise with lazy loading

  /** Roles created by this user for their store (if a StoreUser can create roles) */
  // Consider if this relationship truly belongs here or if roles should be managed
  // by a RoleService/RoleRepository that also tracks the creator.
  @OneToMany(() => Role, (role) => role.createdBy, { lazy: true })
  rolesCreated: Promise<Role[]>; // Use Promise with lazy loading

  // --- Relations supprimées : Accéder via les services ou dépôts dédiés ---
  // /** Products created by this user in the store */
  // @OneToMany(() => Product, (product) => product.createdBy)
  // products: Product[];

  // /** Sales recorded by this user */
  // @OneToMany(() => Sale, (sale) => sale.createdBy)
  // sales: Sale[];

  // /** Expenses recorded by this user */
  // @OneToMany(() => Expense, (expense) => expense.createdBy)
  // expenses: Expense[];

  // /** Inventory movements made by this user */
  // @OneToMany(() => InventoryMovement, (movement) => movement.createdBy)
  // inventoryMovements: InventoryMovement[];

  // /** Customer returns processed by this user */
  // @OneToMany(() => CustomerReturn, (customerReturn) => customerReturn.processedBy)
  // processedReturns: CustomerReturn[];

  // /** Damaged or expired product reports created by this user */
  // @OneToMany(() => DamagedOrExpiredReport, (report) => report.reportedBy)
  // damagedOrExpiredReports: DamagedOrExpiredReport[];

  // /** Damaged or expired product reports approved by this user */
  // @OneToMany(() => DamagedOrExpiredReport, (report) => report.approvedBy)
  // approvedReports: DamagedOrExpiredReport[];

  // /** Supplier orders placed by this user */
  // @OneToMany(() => SupplierOrders, (supplierOrders) => supplierOrders.orderedBy)
  // supplierOrders: SupplierOrders[];

  // /** Suppliers added or updated by this user */
  // @OneToMany(() => Supplier, (supplier) => supplier.createdBy)
  // suppliers: Supplier[];
}
