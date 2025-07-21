import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterSessionsService } from './cash-register-sessions.service';

describe('CashRegisterSessionsService', () => {
  let service: CashRegisterSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashRegisterSessionsService],
    }).compile();

    service = module.get<CashRegisterSessionsService>(CashRegisterSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
