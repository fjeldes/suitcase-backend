import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { VerifyEmail } from './templates/VerifyEmail'
import { PasswordResetEmail } from './templates/PasswordResetEmail'
import { WelcomeEmail } from './templates/WelcomeEmail'
import { StaffInvitationEmail } from './templates/StaffInvitationEmail'
import { BookingReceiptEmail } from './templates/BookingReceiptEmail'
import { StoreApprovedEmail } from './templates/StoreApprovedEmail'

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    const fromName = this.configService.get<string>('resend.fromName') || 'KipGo';
    const fromEmail = this.configService.get<string>('resend.fromEmail') || 'onboarding@resend.dev';
    this.fromEmail = `${fromName} <${fromEmail}>`;
    this.isConfigured = !!apiKey && apiKey !== 're_...' && !apiKey.includes('placeholder');
    if (this.isConfigured) {
      this.resend = new Resend(apiKey!);
    } else {
      this.logger.warn('Resend not configured — emails will be logged to console in dev mode');
    }
  }

  private canSend(): boolean {
    if (!this.isConfigured) {
      this.logger.log('[DEV] Email skipped — configure RESEND_API_KEY in .env to send real emails');
      return false;
    }
    return true;
  }

  private baseUrl = process.env.NODE_ENV === 'production' ? 'https://api.dev.kipgo.app' : 'http://localhost:3000';

  async sendVerificationEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Verification code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Verify your KipGo account',
        react: VerifyEmail({ code, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending verification email', error); }
  }

  async sendPasswordResetEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Password reset code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Reset your KipGo Password',
        react: PasswordResetEmail({ code, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending password reset email', error); }
  }

  async sendStaffInvitation(to: string, name: string, inviterName: string, locationName: string, link: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Staff invitation for ${name} (${to}): ${link}`);
    if (!this.canSend()) return;
    try {
      await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: `${inviterName} invited you to manage ${locationName}`,
        react: StaffInvitationEmail({ inviterName, locationName, link, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending staff invitation', error); }
  }

  async sendBookingReceipt(to: string, _customerName: string, booking: any) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Receipt for ${to} — booking ${booking.id?.slice(0, 8)}`);
    if (!this.canSend()) return;
    try {
      const startDate = booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const startTime = booking.startDate ? new Date(booking.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      const endDate = booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const endTime = booking.endDate ? new Date(booking.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      const total = typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : booking.totalPrice;
      const items = booking.items || {};
      const small = items.small || 0;
      const medium = items.medium || 0;
      const large = items.large || 0;

      await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: `Booking Confirmed — ${booking.location?.name || 'KipGo Store'}`,
        react: BookingReceiptEmail({ booking, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending receipt email', error); }
  }

  async sendWelcomeEmail(to: string, name: string, lang: string = 'en') {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Welcome email for ${name} (${to})`);
    if (!this.canSend()) return;
    const t = (es: string, en: string) => lang === 'es' ? es : en;
    try {
      await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: t('¡Bienvenido a KipGo!', 'Welcome to KipGo!'),
        react: WelcomeEmail({ name, lang, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending welcome email', error); }
  }

  async sendStoreApprovedEmail(to: string, name: string, storeName: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Store approved email for ${name} (${to}): ${storeName}`);
    if (!this.canSend()) return;
    try {
      await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: `¡Tu tienda "${storeName}" ha sido aprobada!`,
        react: StoreApprovedEmail({ storeName, baseUrl: this.baseUrl }),
      });
    } catch (error) { this.logger.error('Error sending store approved email', error); }
  }
}
