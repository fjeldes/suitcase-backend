import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    const fromName = this.configService.get<string>('resend.fromName') || 'SecureCustodian';
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

  async sendVerificationEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Verification code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Verify your SecureCustodian Email',
        html: `<div style="font-family:sans-serif;padding:20px;text-align:center;"><h2 style="color:#0A0E5E;">Welcome to SecureCustodian!</h2><p>Enter this code to verify your email:</p><h1 style="color:#0A0E5E;letter-spacing:5px;">${code}</h1><p>Expires in 15 minutes.</p></div>`,
      });
    } catch (error) { this.logger.error('Error sending verification email', error); }
  }

  async sendPasswordResetEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Password reset code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Reset your SecureCustodian Password',
        html: `<div style="font-family:sans-serif;padding:20px;text-align:center;"><h2>Password Reset</h2><p>Use this code to reset your password:</p><h1 style="color:#E53E3E;letter-spacing:5px;">${code}</h1><p>Expires in 15 minutes.</p></div>`,
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
        html: `<div style="font-family:sans-serif;padding:20px;max-width:500px;margin:0 auto;"><h2 style="color:#0A0E5E;">You're Invited!</h2><p>Hi ${name},</p><p><strong>${inviterName}</strong> invited you to join <strong>${locationName}</strong> as staff.</p><div style="text-align:center;margin:30px 0;"><a href="${link}" style="background-color:#0A0E5E;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block;">Accept Invitation</a></div><p style="color:#64748B;font-size:12px;">Link expires in 7 days.</p></div>`,
      });
    } catch (error) { this.logger.error('Error sending staff invitation', error); }
  }

  async sendBookingReceipt(to: string, _customerName: string, booking: any) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Receipt for ${to} — booking ${booking.id?.slice(0, 8)}`);
    if (!this.canSend()) return;
    try {
      const itemSummary = `S:${booking.items?.small || 0} M:${booking.items?.medium || 0} L:${booking.items?.large || 0}`;
      const total = typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(0) : booking.totalPrice;
      await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: `Booking Complete — ${booking.location?.name || 'Store'}`,
        html: `<div style="font-family:sans-serif;padding:20px;max-width:500px;margin:0 auto;"><h2 style="color:#0A0E5E;text-align:center;">Booking Complete!</h2><hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;" /><table style="width:100%;font-size:14px;"><tr><td style="padding:4px 0;color:#64748B;">Store</td><td style="text-align:right;font-weight:600;">${booking.location?.name || 'N/A'}</td></tr><tr><td style="padding:4px 0;color:#64748B;">Booking</td><td style="text-align:right;font-weight:600;">${booking.qrCode || booking.id?.slice(0, 8)}</td></tr><tr><td style="padding:4px 0;color:#64748B;">Items</td><td style="text-align:right;font-weight:600;">${itemSummary}</td></tr><tr><td style="padding:4px 0;color:#64748B;">Total Paid</td><td style="text-align:right;font-weight:700;font-size:16px;">$${total}</td></tr></table><hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;" /><p style="color:#64748B;font-size:12px;text-align:center;">Need help? Contact support@suitcase.app</p></div>`,
      });
    } catch (error) { this.logger.error('Error sending receipt email', error); }
  }
}
