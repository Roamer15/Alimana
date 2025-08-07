import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAnalyticsController } from './payment-analytics.controller';
import { PaymentAnalyticsService } from './payment-analytics.service';

describe('PaymentAnalyticsController', () => {
  let controller: PaymentAnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentAnalyticsController],
      providers: [PaymentAnalyticsService],
    }).compile();

    controller = module.get<PaymentAnalyticsController>(PaymentAnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
