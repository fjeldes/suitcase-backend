import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';
import { Promo } from './entities/promo.entity';
import { PromoUsage } from './entities/promo-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promo, PromoUsage])],
  controllers: [PromosController],
  providers: [PromosService],
  exports: [PromosService],
})
export class PromosModule {}
