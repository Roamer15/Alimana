import { Test, TestingModule } from '@nestjs/testing';
import { StoreSettingService } from './store-setting.service';

describe('StoreSettingService', () => {
  let service: StoreSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreSettingService],
    }).compile();

    service = module.get<StoreSettingService>(StoreSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
