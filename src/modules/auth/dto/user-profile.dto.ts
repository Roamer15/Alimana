// src/user/dto/user-profile.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from 'src/entities/role.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { Store } from 'src/entities/store.entity';
import { AuthProvider } from 'src/entities/User.entity';

// DTO pour les relations imbriquées
class UserProfileStoreDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

class UserProfileRoleDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

class UserProfileStoreUserDto {
  @Expose()
  id: number;

  @Expose()
  status: string;

  @Expose()
  @Type(() => UserProfileStoreDto)
  store: Store;

  @Expose()
  @Type(() => UserProfileRoleDto)
  role: Role;
}

// DTO principal pour le profil de l'utilisateur
@Exclude()
export class UserProfileDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  phone: string;

  @Expose()
  authProvider: AuthProvider;

  @Expose()
  lastSelectedStoreUserId: number;

  @Expose()
  canCreateStore: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => UserProfileStoreDto)
  stores: Store[];

  @Expose()
  @Type(() => UserProfileStoreUserDto)
  storeUsers: StoreUser[];

  // Nouveau champ pour le rôle dans le magasin actuellement sélectionné
  @Expose()
  @Type(() => UserProfileRoleDto)
  currentStoreRole: Role;
}
