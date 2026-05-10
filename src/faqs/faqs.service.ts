import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from './entities/faq.entity';

@Injectable()
export class FAQsService {
  constructor(
    @InjectRepository(FAQ)
    private readonly faqRepository: Repository<FAQ>,
  ) {}

  async findAll(category?: string): Promise<FAQ[]> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.faqRepository.find({ where, order: { category: 'ASC', order: 'ASC' } });
  }

  async getCategories(): Promise<string[]> {
    const result = await this.faqRepository
      .createQueryBuilder('faq')
      .select('DISTINCT faq.category')
      .where('faq.isActive = :active', { active: true })
      .orderBy('faq.category')
      .getRawMany();
    return result.map((r) => r.faq_category);
  }
}
