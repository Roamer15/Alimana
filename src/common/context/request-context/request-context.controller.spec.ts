import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextController } from './request-context.controller';

describe('RequestContextController', () => {
  let controller: RequestContextController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestContextController],
    }).compile();

    controller = module.get<RequestContextController>(RequestContextController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
