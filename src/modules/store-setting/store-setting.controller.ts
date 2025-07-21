import { Controller, Get, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { StoreSettingService } from './store-setting.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

// DTO pour la mise à jour d'un paramètre
class UpdateStoreSettingDto {
  value: string; // La valeur à modifier
}

@Controller('stores/:storeId/settings')
export class StoreSettingController {
  constructor(private readonly storeSettingService: StoreSettingService) {}

  @Get()
  @UseGuards(StoreJwtGuard)
  @PermissionKeys(PermissionKey.MANAGE_STORE_SETTINGS)
  async findAllSettings(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.storeSettingService.findAllSettings(storeId);
  }

  @Patch(':key') // Mise à jour par la clé du paramètre (ex: 'currency')
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_STORE_SETTINGS)
  async updateSetting(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('key') key: string,
    @Body() updateStoreSettingDto: UpdateStoreSettingDto,
  ) {
    return this.storeSettingService.updateSetting(storeId, key, updateStoreSettingDto.value);
  }
}
