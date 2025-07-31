import { Test, TestingModule } from '@nestjs/testing';
import { CashMovementController } from './cash-movement.controller';

describe('CashMovementController', () => {
  let controller: CashMovementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashMovementController],
    }).compile();

    controller = module.get<CashMovementController>(CashMovementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
