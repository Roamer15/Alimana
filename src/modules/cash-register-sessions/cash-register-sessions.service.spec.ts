import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterSessionService } from './cash-register-sessions.service';

describe('CashRegisterSessionsService', () => {
  let service: CashRegisterSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashRegisterSessionService],
    }).compile();

    service = module.get<CashRegisterSessionService>(CashRegisterSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
