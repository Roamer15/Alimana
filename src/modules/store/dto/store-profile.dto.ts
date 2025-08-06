import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from 'src/entities/role.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { User } from 'src/entities/User.entity';

// DTO pour les relations imbriquées
class UserInStoreDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  fullName: string;
}

class RoleInStoreDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;
}

class StoreUserInStoreDto {
  @Expose()
  id: number;

  @Expose()
  status: string;

  @Expose()
  @Type(() => UserInStoreDto)
  user: User;

  @Expose()
  @Type(() => RoleInStoreDto)
  role: Role;
}

// DTO principal pour le profil du magasin
@Exclude()
export class StoreProfileDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  logoUrl?: string;

  @Expose()
  profileImageUrl?;

  @Expose()
  websiteUrl?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  ownerId: number;

  // Charge tous les StoreUser avec les détails des utilisateurs et des rôles
  @Expose()
  @Type(() => StoreUserInStoreDto)
  storeUsers: StoreUser[];
}
