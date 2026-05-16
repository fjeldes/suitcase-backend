import { Controller, Get, Param, Query } from '@nestjs/common';
import { FAQsService } from './faqs.service';

@Controller('faqs')
export class FAQsController {
  constructor(private readonly faqsService: FAQsService) {}

  @Get()
  async findAll(@Query('category') category?: string, @Query('lang') lang?: string) {
    return this.faqsService.findAll(category, lang);
  }

  @Get('categories')
  async getCategories() {
    return this.faqsService.getCategories();
  }
}
