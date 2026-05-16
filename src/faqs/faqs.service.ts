import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from './entities/faq.entity';

const DEFAULT_FAQS = [
  { question: 'How do I book a luggage storage?', questionEs: '¿Cómo reservo un almacenamiento?', answer: 'Search for a nearby store, select your dates and luggage items, then confirm your booking. Payment is processed securely through Stripe.', answerEs: 'Busca una tienda cercana, selecciona tus fechas y artículos, luego confirma tu reserva. El pago se procesa de forma segura a través de Stripe.', category: 'general', order: 1 },
  { question: 'What items are not allowed?', questionEs: '¿Qué artículos no están permitidos?', answer: 'Hazardous materials, illegal items, perishable goods, weapons, or valuables exceeding $2,500.', answerEs: 'Materiales peligrosos, artículos ilegales, alimentos perecibles, armas u objetos de valor que excedan los $2,500.', category: 'general', order: 2 },
  { question: 'Can I extend my storage period?', questionEs: '¿Puedo extender mi período de almacenamiento?', answer: 'Yes, you can extend through the app if capacity is available. Additional charges apply.', answerEs: 'Sí, puedes extender desde la app si hay disponibilidad. Aplican cargos adicionales.', category: 'bookings', order: 1 },
  { question: 'How do I cancel a booking?', questionEs: '¿Cómo cancelo una reserva?', answer: 'Cancel from the booking details screen. Cancellations before check-in are fully refunded.', answerEs: 'Cancela desde la pantalla de detalles de la reserva. Las cancelaciones antes del check-in tienen reembolso completo.', category: 'bookings', order: 2 },
  { question: 'What payment methods do you accept?', questionEs: '¿Qué métodos de pago aceptan?', answer: 'All major credit and debit cards through Stripe.', answerEs: 'Todas las tarjetas de crédito y débito principales a través de Stripe.', category: 'payments', order: 1 },
  { question: 'When will I be charged?', questionEs: '¿Cuándo se me cobrará?', answer: 'Payment is processed at the time of booking confirmation.', answerEs: 'El pago se procesa al momento de confirmar la reserva.', category: 'payments', order: 2 },
  { question: 'How do I update my profile?', questionEs: '¿Cómo actualizo mi perfil?', answer: 'Go to Profile > Settings > Edit Profile to update your name and photo.', answerEs: 'Ve a Perfil > Configuración > Editar Perfil para actualizar tu nombre y foto.', category: 'account', order: 1 },
  { question: 'How do I become a store owner?', questionEs: '¿Cómo me convierto en socio?', answer: 'Tap "Become a Partner" in your profile to register as an owner.', answerEs: 'Toca "Conviértete en Socio" en tu perfil para registrarte como dueño.', category: 'account', order: 2 },
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
      console.log('✅ Default FAQs seeded with ES/EN');
    }
  }

  async findAll(category?: string, lang?: string): Promise<any[]> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    const faqs = await this.faqRepository.find({ where, order: { category: 'ASC', order: 'ASC' } });
    return faqs.map((faq) => ({
      id: faq.id,
      question: lang === 'es' && faq.questionEs ? faq.questionEs : faq.question,
      answer: lang === 'es' && faq.answerEs ? faq.answerEs : faq.answer,
      category: faq.category,
      order: faq.order,
    }));
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
