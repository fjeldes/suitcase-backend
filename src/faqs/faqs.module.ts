import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQ } from './entities/faq.entity';
import { FAQsController } from './faqs.controller';
import { FAQsService } from './faqs.service';

@Module({
  imports: [TypeOrmModule.forFeature([FAQ])],
  controllers: [FAQsController],
  providers: [FAQsService],
  exports: [FAQsService],
})
export class FAQsModule {}
