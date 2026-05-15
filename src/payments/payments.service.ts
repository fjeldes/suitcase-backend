import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: any;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  /**
   * Crea un PaymentIntent para procesar un pago inmediato.
   */
  async createPaymentIntent(amount: number, currency: string = 'usd', customerId?: string) {
    console.log("amount", amount);
    console.log("currency", currency);
    console.log("customerId", customerId);
    // Nota: Stripe Chile acepta CLP, pero el monto mínimo es ~500 CLP.
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe espera enteros (clp no tiene decimales)
      currency,
      customer: customerId,
      // Habilita el guardado de la tarjeta si es necesario
      setup_future_usage: 'off_session',
    });

    return {
      clientSecret: intent.client_secret,
      id: intent.id,
    };
  }

  /**
   * Crea una Ephemeral Key para que la App acceda al cliente de forma segura.
   */
  async createEphemeralKey(customerId: string) {
    return this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2025-01-27.acacia' } // Debe coincidir con la versión de la API
    );
  }

  /**
   * Crea un cliente en Stripe para guardar sus tarjetas.
   */
  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  /**
   * Crea un SetupIntent para guardar una tarjeta sin cobrar.
   */
  async createSetupIntent(customerId: string) {
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    return {
      clientSecret: setupIntent.client_secret,
    };
  }

  async confirmPaymentIntent(amount: number, currency: string, customerId: string, paymentMethodId: string) {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
      });

      if (intent.status === 'requires_action' || intent.status === 'requires_source_action') {
        return {
          requiresAction: true,
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
        };
      }

      if (intent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: intent.id,
        };
      }

      return {
        success: false,
        error: `Payment in status: ${intent.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Payment failed',
      };
    }
  }

  async getCustomerPaymentMethods(customerId: string) {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Mapeamos para enviar solo lo que el frontend de Suitcase necesita
    return paymentMethods.data.map((pm) => ({
      id: pm.id,                   // Importante para hacer el cobro después
      brand: pm.card?.brand,       // 'visa', 'mastercard', etc.
      last4: pm.card?.last4,       // Los últimos 4 dígitos
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      funding: pm.card?.funding,   // 'credit' o 'debit'
    }));
  }

}
