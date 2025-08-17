import { Test, TestingModule } from '@nestjs/testing';
import { YieldsController } from './yields.controller';
import { YieldsService } from './yields.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('YieldsController', () => {
  let controller: YieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YieldsController],
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

    controller = module.get<YieldsController>(YieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
