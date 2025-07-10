import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreUser } from './store-user.entity';
import { Invitation } from './invitation.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // Boutique à laquelle ce rôle est affecté.
  // Plusieurs rôles peuvent appartenir à une même boutique.
  @ManyToOne(() => Store, (store) => store.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' }) // optionnel utliser si je veux nommer la FK
  store: Store;

  @Column()
  storeId: number;

  // role est creer par un employer de la table stor_user
  //cette relation donner l'id du stor_user qui a creer le role
  @ManyToOne(() => StoreUser, (user) => user.rolesCreated, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: StoreUser;

  @Column({ nullable: true })
  createdByUserId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Un rôle peut être attribué à plusieurs employés (StoreUser) d'une boutique.
  // Cette relation liste tous les employés ayant ce rôle dans leur boutique.
  @OneToMany(() => StoreUser, (storeUser) => storeUser.role)
  storeUsers: StoreUser[];

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  //on peut inviter plusieur employer avec le meme role
  // liste tout les invitation concerner par ce rolle
  @OneToMany(() => Invitation, (invitation) => invitation.role, { cascade: true })
  invitations: Invitation[];
}
