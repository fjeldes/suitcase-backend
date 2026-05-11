import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from './entities/faq.entity';

const DEFAULT_FAQS = [
  { question: 'How do I book a luggage storage?', answer: 'Search for a nearby store, select your dates and luggage items, then confirm your booking. Payment is processed securely through Stripe.', category: 'general', order: 1 },
  { question: 'What items are not allowed?', answer: 'Hazardous materials, illegal items, perishable goods, weapons, or valuables exceeding $2,500.', category: 'general', order: 2 },
  { question: 'Can I extend my storage period?', answer: 'Yes, you can extend through the app if capacity is available. Additional charges apply.', category: 'bookings', order: 1 },
  { question: 'How do I cancel a booking?', answer: 'Cancel from the booking details screen. Cancellations before check-in are fully refunded.', category: 'bookings', order: 2 },
  { question: 'What payment methods do you accept?', answer: 'All major credit and debit cards through Stripe.', category: 'payments', order: 1 },
  { question: 'When will I be charged?', answer: 'Payment is processed at the time of booking confirmation.', category: 'payments', order: 2 },
  { question: 'How do I update my profile?', answer: 'Go to Profile > Settings > Edit Profile to update your name and photo.', category: 'account', order: 1 },
  { question: 'How do I become a store owner?', answer: 'Tap "Become a Partner" in your profile to register as an owner.', category: 'account', order: 2 },
];

@Injectable()
export class FAQsService implements OnModuleInit {
  constructor(
    @InjectRepository(FAQ)
    private readonly faqRepository: Repository<FAQ>,
  ) {}

  async onModuleInit() {
    const count = await this.faqRepository.count();
    if (count === 0) {
      for (const faq of DEFAULT_FAQS) {
        await this.faqRepository.save(faq);
      }
      console.log('✅ Default FAQs seeded');
    }
  }

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
