import { Controller, Get, Param, Query } from '@nestjs/common';
import { FAQsService } from './faqs.service';

@Controller('faqs')
export class FAQsController {
  constructor(private readonly faqsService: FAQsService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    return this.faqsService.findAll(category);
  }

  @Get('categories')
  async getCategories() {
    return this.faqsService.getCategories();
  }
}
