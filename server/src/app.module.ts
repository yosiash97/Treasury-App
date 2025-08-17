import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YieldsModule } from './yields/yields.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [YieldsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
