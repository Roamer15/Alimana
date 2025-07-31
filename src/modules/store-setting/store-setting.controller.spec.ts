import { Test, TestingModule } from '@nestjs/testing';
import { StoreSettingController } from './store-setting.controller';

describe('StoreSettingController', () => {
  let controller: StoreSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreSettingController],
    }).compile();

    controller = module.get<StoreSettingController>(StoreSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
