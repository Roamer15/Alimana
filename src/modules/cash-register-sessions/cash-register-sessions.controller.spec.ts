import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterSessionsController } from './cash-register-sessions.controller';
import { CashRegisterSessionService } from './cash-register-sessions.service';

describe('CashRegisterSessionsController', () => {
  let controller: CashRegisterSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashRegisterSessionsController],
      providers: [CashRegisterSessionService],
    }).compile();

    controller = module.get<CashRegisterSessionsController>(CashRegisterSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
