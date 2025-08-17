import { Test, TestingModule } from '@nestjs/testing';
import { YieldsService } from './yields.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('YieldsService', () => {
  let service: YieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YieldsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<YieldsService>(YieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
