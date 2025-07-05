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

import { Users as User } from './User.entity';
import { Store } from './store.entity';
import { Role } from './role.entity';
import { Invitation } from './invitation.entity';
import { AuditLog } from './audit-logs.entity';
import { Sale } from './sale.entity';
import { Expense } from './expenses.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { CashRegisterSession } from './cash-register-session.entity';
import { CustomerReturn } from './customer-return.entity';
import { DamagedOrExpiredReport } from './damaged-or-expired-report.entity';
import { SupplierOrders } from './supplier-order.entity';
import { Supplier } from './supplier.entity';
import { Product } from './product.entity';

// État possible d’un utilisateur dans une boutique
export enum StoreUserStatus {
  PENDING = 'pending', // Invitation en attente ou utilisateur pas encore actif
  ACTIVE = 'active', // Utilisateur actif dans la boutique
  SUSPENDED = 'suspended', // Accès suspendu
}

@Entity('store_users')
export class StoreUser {
  @PrimaryGeneratedColumn()
  id: number; // Identifiant unique

  // Utilisateur général (de la table Users) lié à cette entrée boutique
  @ManyToOne(() => User, (user) => user.storeUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @Column()
  userId: number;

  // Boutique à laquelle appartient cet utilisateur
  @ManyToOne(() => Store, (store) => store.storeUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  @Index()
  store: Store;

  @Column()
  storeId: number;

  // Rôle de l’utilisateur dans la boutique (admin, caissier, etc.)
  @ManyToOne(() => Role, (role) => role.storeUsers, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  roleId: number;

  // Statut d’activité de l’utilisateur dans cette boutique
  @Column({ type: 'enum', enum: StoreUserStatus, default: StoreUserStatus.PENDING })
  status: StoreUserStatus;

  // Date d’entrée effective dans la boutique (après acceptation d’une invitation, par exemple)
  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date; // Date de création de la relation

  @UpdateDateColumn()
  updatedAt: Date; // Date de mise à jour

  // === Relations secondaires ===

  /** Invitations envoyées par cet utilisateur vers d'autres personnes */
  @OneToMany(() => Invitation, (invitation) => invitation.invitedBy)
  invitationsSent: Invitation[];

  /** produits crées par cet utilisateur dans la boutique */
  @OneToMany(() => Product, (product) => product.createdBy)
  products: Product[];

  /** Actions faites par l'utilisateur qui sont enregistrées dans les logs d'audit */
  @OneToMany(() => AuditLog, (log) => log.storeUser)
  auditLogs: AuditLog[];

  /** Ventes enregistrées par cet utilisateur */
  @OneToMany(() => Sale, (sale) => sale.createdBy)
  sales: Sale[];

  /** Dépenses enregistrées par cet utilisateur */
  @OneToMany(() => Expense, (expense) => expense.createdBy)
  expenses: Expense[];

  /** Mouvements d’inventaire effectués par cet utilisateur */
  @OneToMany(() => InventoryMovement, (movement) => movement.createdBy)
  inventoryMovements: InventoryMovement[];

  /** Sessions de caisse ouvertes ou fermées par cet utilisateur */
  @OneToMany(() => CashRegisterSession, (session) => session.createdBy)
  cashRegisterSessions: CashRegisterSession[];

  /** Rôles créés par cet utilisateur pour sa boutique */
  @OneToMany(() => Role, (role) => role.createdBy)
  rolesCreated: Role[];

  /** Retours clients enregistrés par cet utilisateur */
  @OneToMany(() => CustomerReturn, (customerReturn) => customerReturn.processedBy)
  processedReturns: CustomerReturn[];

  /** Rapports de produits endommagés/périmés créés par cet utilisateur */
  @OneToMany(() => DamagedOrExpiredReport, (report) => report.reportedBy)
  damagedOrExpiredReports: DamagedOrExpiredReport[];

  /** Rapports de produits endommagés/périmés approver par cet utilisateur */
  @OneToMany(() => DamagedOrExpiredReport, (report) => report.approvedBy)
  approvedReports: DamagedOrExpiredReport[];

  /** Commandes fournisseurs passées par cet utilisateur */
  @OneToMany(() => SupplierOrders, (supplierOrders) => supplierOrders.orderedBy)
  SupplierOrders: SupplierOrders[];

  /** Fournisseurs ajoutés ou mis à jour par cet utilisateur */
  @OneToMany(() => Supplier, (supplier) => supplier.createdBy)
  suppliers: Supplier[];
}
