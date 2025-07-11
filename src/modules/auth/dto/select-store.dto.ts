// src/auth/dto/select-store.dto.ts
import { IsNumber, IsNotEmpty } from 'class-validator';

export class SelectStoreDto {
  @IsNotEmpty()
  @IsNumber()
  store_user_id: number;
}
