import { IsArray, ArrayNotEmpty, IsNumber, ArrayMinSize } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true }) // Validates each element is a number
  @ArrayMinSize(1) // Explicit minimum size for clarity
  permissionIds: number[];
}
