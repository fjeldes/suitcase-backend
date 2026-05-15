import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PaymentsService } from './payments.service';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  @Post('create-payment-sheet')
  @UseGuards(JwtAuthGuard)
  async createPaymentSheet(
    @GetUser() user: any,
    @Body() body: { amount: number; currency?: string },
  ) {
    const userId = user.userId || user.id;
    const dbUser = await this.userRepository.findOne({ where: { id: userId } });
    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.paymentsService.createCustomer(
        user.email,
        user.email?.split('@')[0] || 'User',
      );
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
    }

    // 2. Creamos la intención de pago
    const { clientSecret, id: paymentIntentId } = await this.paymentsService.createPaymentIntent(
      body.amount,
      body.currency || 'usd',
      customerId!,
    );

    // 3. Generamos una Ephemeral Key para acceso seguro del cliente
    const ephemeralKey = await this.paymentsService.createEphemeralKey(customerId!);

    return {
      paymentIntent: clientSecret,
      customer: customerId,
      ephemeralKey: ephemeralKey.secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  @Post('create-setup-intent')
  @UseGuards(JwtAuthGuard)
  async createSetupIntent(@GetUser() user: any) {
    const userId = user.userId || user.id;
    const dbUser = await this.userRepository.findOne({ where: { id: userId } });
    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.paymentsService.createCustomer(user.email, user.email?.split('@')[0] || 'User');
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
    }

    const { clientSecret } = await this.paymentsService.createSetupIntent(customerId!);
    const ephemeralKey = await this.paymentsService.createEphemeralKey(customerId!);

    return {
      clientSecret,
      customer: customerId,
      ephemeralKey: ephemeralKey.secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  @Post('confirm-payment')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @GetUser() user: any,
    @Body() body: { amount: number; currency?: string; paymentMethodId: string },
  ) {
    const userId = user.userId || user.id;
    const dbUser = await this.userRepository.findOne({ where: { id: userId } });
    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.paymentsService.createCustomer(
        user.email,
        user.email?.split('@')[0] || 'User',
      );
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
    }

    return this.paymentsService.confirmPaymentIntent(
      body.amount,
      body.currency || 'usd',
      customerId!,
      body.paymentMethodId,
    );
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getMethods(@GetUser() user: any) {
    const userId = user.userId || user.id;
    const dbUser = await this.userRepository.findOne({ where: { id: userId } });

    if (!dbUser?.stripeCustomerId) return [];

    return this.paymentsService.getCustomerPaymentMethods(dbUser.stripeCustomerId);
  }
}
