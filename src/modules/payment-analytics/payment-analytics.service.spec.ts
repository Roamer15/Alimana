import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAnalyticsService } from './payment-analytics.service';

describe('PaymentAnalyticsService', () => {
  let service: PaymentAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAnalyticsService],
    }).compile();

    service = module.get<PaymentAnalyticsService>(PaymentAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
