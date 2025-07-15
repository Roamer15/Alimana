export class CreateRoleDto {
  name: string;
  description?: string;
  isDefault?: boolean;
  storeId: number;
  createdByUserId?: number;
  permissionIds: number[];
}
