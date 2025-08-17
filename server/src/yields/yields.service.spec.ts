import { Test, TestingModule } from '@nestjs/testing';
import { YieldsService } from './yields.service';

describe('YieldsService', () => {
  let service: YieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YieldsService],
    }).compile();

    service = module.get<YieldsService>(YieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
