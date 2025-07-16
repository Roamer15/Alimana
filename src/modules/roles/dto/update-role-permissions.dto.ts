import { IsArray, ArrayNotEmpty } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  permissionIds: number[];
}
