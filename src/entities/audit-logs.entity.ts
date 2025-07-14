import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Actions d'authentification/utilisateur
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  INVITATION_SENT = 'INVITATION_SENT',

  // Actions spécifiques aux sessions de caisse
  CASH_REGISTER_SESSION_OPENED = 'CASH_REGISTER_SESSION_OPENED',
  CASH_REGISTER_SESSION_CLOSED = 'CASH_REGISTER_SESSION_CLOSED',

  // Actions spécifiques aux ventes
  SALE_CREATED = 'SALE_CREATED',
  SALE_UPDATED = 'SALE_UPDATED', // Pour les mises à jour générales de la vente (hors statut)
  SALE_COMPLETED = 'SALE_COMPLETED',
  SALE_CANCELLED = 'SALE_CANCELLED',

  // Actions spécifiques aux mouvements de stock
  INVENTORY_MOVEMENT_CREATED = 'INVENTORY_MOVEMENT_CREATED',
  INVENTORY_MOVEMENT_UPDATED = 'INVENTORY_MOVEMENT_UPDATED', // Pour les mises à jour générales du mouvement
  INVENTORY_MOVEMENT_APPROVED = 'INVENTORY_MOVEMENT_APPROVED', // Si un mouvement a un statut d'approbation
  INVENTORY_MOVEMENT_REJECTED = 'INVENTORY_MOVEMENT_REJECTED',

  // Actions spécifiques aux retours clients
  CUSTOMER_RETURN_CREATED = 'CUSTOMER_RETURN_CREATED',
  CUSTOMER_RETURN_PROCESSED = 'CUSTOMER_RETURN_PROCESSED',
  CUSTOMER_RETURN_CANCELLED = 'CUSTOMER_RETURN_CANCELLED',

  // Actions spécifiques aux rapports de produits endommagés/expirés
  DAMAGE_REPORT_CREATED = 'DAMAGE_REPORT_CREATED',
  DAMAGE_REPORT_APPROVED = 'DAMAGE_REPORT_APPROVED',
  DAMAGE_REPORT_REJECTED = 'DAMAGE_REPORT_REJECTED',

  // Autres actions métier
  REPORT_GENERATED = 'REPORT_GENERATED',
  PRODUCT_STOCK_ADJUSTED = 'PRODUCT_STOCK_ADJUSTED', // Peut être utilisé en plus de l'UPDATE générique du produit si besoin
}

@Entity('audit_logs')
@Index(['actionType', 'entity', 'entityId', 'storeId', 'storeUserId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id', nullable: true })
  storeId: number | null;

  @ManyToOne(() => StoreUser, (user) => user.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_user_id' })
  storeUser: StoreUser;

  @Index()
  @Column({ name: 'store_user_id', nullable: true })
  storeUserId: number | null;

  @Column({ type: 'enum', enum: AuditActionType })
  actionType: AuditActionType;

  @Index()
  @Column()
  entity: string; // ex: 'Product', 'Sale', etc.

  @Index()
  @Column({ type: 'varchar', length: 255 })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: object | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue: object | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;
}
