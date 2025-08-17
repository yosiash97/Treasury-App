import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { YieldsController } from './yields.controller';
import { YieldsService } from './yields.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      headers: { Accept: 'application/xml,text/xml' },
      maxRedirects: 3,
    }),
    CacheModule.register({
      ttl: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
      max: 100, // max number of cached items
    }),
  ],
  controllers: [YieldsController],
  providers: [YieldsService],
})
export class YieldsModule {}
