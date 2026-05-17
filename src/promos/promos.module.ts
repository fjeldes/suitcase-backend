import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';
import { Promo } from './entities/promo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promo])],
  controllers: [PromosController],
  providers: [PromosService],
  exports: [PromosService],
})
export class PromosModule {}
