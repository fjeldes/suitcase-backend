import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail = 'Acme <onboarding@resend.dev>';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, code: string) {
    this.logger.log(`Sending verification email to ${to} with code ${code}`);
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Verify your SecureTransit Email',
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome to SecureTransit!</h2>
            <p>Please enter the following 6-digit code in the app to verify your email address:</p>
            <h1 style="color: #0A0E5E; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 15 minutes.</p>
          </div>
        `,
      });
      return data;
    } catch (error) {
      this.logger.error('Error sending verification email', error);
      // Para desarrollo/MVP si no hay key válida, evitamos crashear
      // throw error; 
    }
  }

  async sendPasswordResetEmail(to: string, code: string) {
    this.logger.log(`Sending password reset email to ${to} with code ${code}`);
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Reset your SecureTransit Password',
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Use the code below to set a new password:</p>
            <h1 style="color: #E53E3E; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 15 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      return data;
    } catch (error) {
      this.logger.error('Error sending password reset email', error);
    }
  }

  async sendStaffInvitation(to: string, name: string, inviterName: string, locationName: string, link: string) {
    this.logger.log(`Sending staff invitation to ${to}`);
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `${inviterName} invited you to manage ${locationName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #0A0E5E;">You're Invited!</h2>
            <p>Hi ${name},</p>
            <p><strong>${inviterName}</strong> has invited you to join their team at <strong>${locationName}</strong> as a staff member.</p>
            <p>As staff, you'll be able to manage bookings, check-in and check-out luggage.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #0A0E5E; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #64748B; font-size: 12px;">This link expires in 7 days. If you didn't expect this invitation, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending staff invitation email', error);
    }
  }

  async sendBookingReceipt(to: string, customerName: string, booking: any) {
    this.logger.log(`Sending booking receipt to ${to}`);
    try {
      const itemSummary = `S:${booking.items?.small || 0} M:${booking.items?.medium || 0} L:${booking.items?.large || 0}`;
      const total = typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(0) : booking.totalPrice;
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Booking Complete — ${booking.location?.name || 'Store'}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #0A0E5E; text-align: center;">Booking Complete!</h2>
            <p style="text-align: center;">Thank you for storing with SecureCustodian.</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #64748B;">Store</td><td style="text-align: right; font-weight: 600;">${booking.location?.name || 'N/A'}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Booking ID</td><td style="text-align: right; font-weight: 600;">${booking.qrCode || booking.id?.slice(0, 8)}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Items</td><td style="text-align: right; font-weight: 600;">${itemSummary}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Total Paid</td><td style="text-align: right; font-weight: 700; font-size: 16px;">$${total}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <p style="color: #64748B; font-size: 12px; text-align: center;">If you have any questions, contact our support team at support@suitcase.app</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending receipt email', error);
    }
  }
}
