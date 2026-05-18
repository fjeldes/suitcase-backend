import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Transaction, TransactionStatus } from 'src/transactions/entities/transaction.entity';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private stripe: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
  ) {
    const StripeLib = require('stripe');
    this.stripe = new StripeLib(this.configService.get('STRIPE_SECRET_KEY') || '');
  }

  @Post('stripe')
  async handleStripe(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured — webhook validation disabled');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        typeof body === 'string' ? body : JSON.stringify(body),
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.error('Stripe webhook signature verification failed', err.message);
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as any;
        const status = event.type === 'payment_intent.succeeded' ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED;
        await this.transactionRepo.update({ providerTransactionId: pi.id }, { status });
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as any;
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (piId) {
          await this.transactionRepo.update({ providerTransactionId: piId }, { status: TransactionStatus.REFUNDED });
        }
        break;
      }
    }

    return { received: true };
  }
}
