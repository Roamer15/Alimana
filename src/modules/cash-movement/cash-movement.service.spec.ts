import { Test, TestingModule } from '@nestjs/testing';
import { CashMovementService } from './cash-movement.service';

describe('CashMovementService', () => {
  let service: CashMovementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashMovementService],
    }).compile();

    service = module.get<CashMovementService>(CashMovementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
