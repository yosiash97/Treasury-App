import { Test, TestingModule } from '@nestjs/testing';
import { YieldsController } from './yields.controller';
import { YieldsService } from './yields.service';

describe('YieldsController', () => {
  let controller: YieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YieldsController],
      providers: [YieldsService],
    }).compile();

    controller = module.get<YieldsController>(YieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
