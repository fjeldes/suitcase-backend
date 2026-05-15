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

  async sendVerificationEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Verification code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      const formattedCode = code.split('').join(' ');
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Verifica tu cuenta — KipGo',
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>body{font-family:Inter,sans-serif;background:#f9f9f9;margin:0;padding:0}.container{max-width:480px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(26,35,126,0.06)}.header{background:#f3f3f3;padding:32px;text-align:center}.logo{height:64px;width:auto}.content{padding:48px 40px;text-align:center}.icon{font-size:40px;margin-bottom:16px}h1{font-family:Manrope,sans-serif;font-size:32px;font-weight:800;color:#1a237e;margin:0 0 8px}.desc{color:#454652;font-size:15px;line-height:22px;margin:0 0 32px}.otp-box{background:#f3f3f3;border-radius:12px;padding:32px;margin-bottom:32px;text-align:center}.otp-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#454652;margin-bottom:16px}.otp-code{font-family:Manrope,sans-serif;font-size:48px;font-weight:800;letter-spacing:8px;color:#1a237e;margin:0}.otp-expiry{font-size:12px;color:#767683;margin-top:16px}.steps{text-align:left;margin-bottom:32px;display:flex;flex-direction:column;gap:16px}.step{display:flex;align-items:flex-start;gap:16px;padding:16px;background:#f9f9f9;border-radius:12px}.step-icon{flex-shrink:0;margin-top:2px;color:#9f4200;font-size:16px}.step-title{font-family:Manrope,sans-serif;font-weight:700;color:#1a1c1c;margin:0 0 2px}.step-desc{font-size:13px;color:#454652;margin:0}.btn{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;background:linear-gradient(135deg,#000666,#1a237e);color:#ffffff;border-radius:14px;text-decoration:none;font-weight:600;font-size:15px}.footer{background:#f3f3f3;padding:32px;text-align:center;border-top:1px solid rgba(198,197,212,0.15)}.footer-text{font-size:12px;color:#454652;margin:0 0 4px;line-height:18px}.footer-copy{font-size:12px;color:#454652;font-weight:600;margin:0}</style></head>
<body>
<div class="container">
<div class="header"><img class="logo" src="https://api.dev.kipgo.app/logo.png" alt="KipGo"/></div>
<div class="content">
<div class="icon">🔒</div>
<h1>Verifica tu cuenta</h1>
<p class="desc">Ingresa este código de seguridad en la aplicación para confirmar tu registro y comenzar a usar KipGo.</p>
<div class="otp-box">
<div class="otp-label">Tu código de verificación</div>
<div class="otp-code">${formattedCode}</div>
<p class="otp-expiry">Este código expirará en 10 minutos.</p>
</div>
<div class="steps">
<div class="step"><div class="step-icon">📱</div><div><h3 class="step-title">1. Abre la aplicación</h3><p class="step-desc">Regresa a la pantalla de verificación en KipGo.</p></div></div>
<div class="step"><div class="step-icon">⌨️</div><div><h3 class="step-title">2. Ingresa el código</h3><p class="step-desc">Escribe los 6 números exactos mostrados arriba.</p></div></div>
<div class="step"><div class="step-icon">✅</div><div><h3 class="step-title">3. Listo para empezar</h3><p class="step-desc">Tu cuenta estará segura y lista para guardar tu equipaje.</p></div></div>
</div>
</div>
<div class="footer">
<p class="footer-text">Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
<p class="footer-copy">© 2024 KipGo. Todos los derechos reservados.</p>
</div>
</div>
</body>
</html>`,
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
