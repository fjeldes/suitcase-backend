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

  private head(title: string) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>body{font-family:Inter,sans-serif;background:#f9f9f9;margin:0;padding:0}.container{max-width:480px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(26,35,126,0.06)}.header{background:#f3f3f3;padding:32px;text-align:center}.logo{height:48px;width:auto}.content{padding:40px}.footer{background:#f3f3f3;padding:24px;text-align:center;border-top:1px solid rgba(198,197,212,0.15)}.footer-text{font-size:12px;color:#767683;margin:0 0 4px;line-height:18px}.footer-copy{font-size:12px;color:#767683;margin:0}h1{font-family:Manrope,sans-serif;font-weight:700;color:#1a237e}p{color:#454652;font-size:14px;line-height:22px;margin:0 0 16px}a{color:#1a237e}.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;min-width:200px}
</style></head><body><div class="container"><div class="header"><img class="logo" src="https://api.dev.kipgo.app/logo.png" alt="KipGo"/></div>`;
  }

  private foot() {
    return `<div class="footer"><p class="footer-text">© 2025 KipGo. Todos los derechos reservados.</p><p class="footer-copy">This is an automated message, please do not reply.</p></div></div></body></html>`;
  }

  async sendVerificationEmail(to: string, code: string) {
    this.logger.log(`[${this.isConfigured ? 'EMAIL' : 'DEV'}] Verification code for ${to}: ${code}`);
    if (!this.canSend()) return;
    try {
      const formattedCode = code.split('').join(' ');
      return await this.resend.emails.send({
        from: this.fromEmail, to,
        subject: 'Verifica tu cuenta — KipGo',
        html: `${this.head('')}
<div class="content" style="text-align:center">
<div style="font-size:40px;margin-bottom:16px">🔒</div>
<h1 style="font-size:32px;margin:0 0 8px">Verifica tu cuenta</h1>
<p style="margin:0 0 32px;font-size:15px">Ingresa este código de seguridad en la aplicación para confirmar tu registro y comenzar a usar KipGo.</p>
<div style="background:#f3f3f3;border-radius:12px;padding:32px;margin-bottom:32px">
<div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#454652;margin-bottom:16px">Tu código de verificación</div>
<div style="font-family:Manrope,sans-serif;font-size:48px;font-weight:800;letter-spacing:8px;color:#1a237e;margin:0">${formattedCode}</div>
<p style="font-size:12px;color:#767683;margin-top:16px">Este código expirará en 10 minutos.</p>
</div>
<div style="text-align:left;display:flex;flex-direction:column;gap:16px;margin-bottom:32px">
<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;background:#f9f9f9;border-radius:12px"><div style="flex-shrink:0">📱</div><div><h3 style="font-family:Manrope,sans-serif;font-weight:700;color:#1a1c1c;margin:0 0 2px;font-size:14px">1. Abre la aplicación</h3><p style="font-size:13px;color:#454652;margin:0">Regresa a la pantalla de verificación en KipGo.</p></div></div>
<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;background:#f9f9f9;border-radius:12px"><div style="flex-shrink:0">⌨️</div><div><h3 style="font-family:Manrope,sans-serif;font-weight:700;color:#1a1c1c;margin:0 0 2px;font-size:14px">2. Ingresa el código</h3><p style="font-size:13px;color:#454652;margin:0">Escribe los 6 números exactos mostrados arriba.</p></div></div>
<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;background:#f9f9f9;border-radius:12px"><div style="flex-shrink:0">✅</div><div><h3 style="font-family:Manrope,sans-serif;font-weight:700;color:#1a1c1c;margin:0 0 2px;font-size:14px">3. Listo para empezar</h3><p style="font-size:13px;color:#454652;margin:0">Tu cuenta estará segura y lista para guardar tu equipaje.</p></div></div>
</div>
<p style="font-size:12px;color:#767683">Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
</div>
${this.foot()}`,
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
        html: `${this.head('')}
<div class="content" style="text-align:center">
<div style="width:64px;height:64px;background:#f3f3f3;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px"><span style="font-size:32px">🔑</span></div>
<h1 style="font-size:28px;margin:0 0 16px">Reset your KipGo Password</h1>
<p style="margin:0 0 32px">Use the code below to reset your password. This code will expire in 10 minutes.</p>
<div style="background:#f3f3f3;border-radius:12px;padding:24px;margin-bottom:8px;text-align:center">
<div style="font-family:Manrope,sans-serif;font-size:40px;font-weight:800;letter-spacing:8px;color:#1a237e">${code}</div>
<div style="font-size:11px;color:#767683;text-transform:uppercase;letter-spacing:1px;margin-top:8px">Reset code</div>
</div>
<p style="font-size:12px;color:#767683;margin:32px 0">Enter this code in the app to set a new password.</p>
<div style="background:#f3f3f3;border-radius:12px;padding:20px;display:flex;gap:16px;border:1px solid rgba(198,197,212,0.15)">
<div style="flex-shrink:0;font-size:18px">ℹ️</div>
<p style="font-size:12px;color:#454652;margin:0;line-height:18px">If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
</div>
</div>
${this.foot()}`,
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
        html: `${this.head('')}
<div class="content">
<div style="display:inline-block;background:#e0e0ff;color:#000767;font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;margin-bottom:16px;letter-spacing:1px">STAFF INVITATION</div>
<h1 style="font-size:28px;margin:0 0 16px;line-height:1.2">${inviterName} has invited you to manage ${locationName} on KipGo</h1>
<p style="margin:0 0 32px;font-size:15px">You have been granted staff access to manage operations at ${locationName}. Join the team to help provide secure and seamless luggage storage services.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px">
<div style="background:#f3f3f3;border-radius:12px;padding:20px">
<div style="background:#fff;padding:8px;border-radius:8px;display:inline-flex;margin-bottom:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">📋</div>
<h3 style="font-family:Manrope,sans-serif;font-weight:600;color:#1a1c1c;margin:0 0 4px;font-size:15px">Manage Bookings</h3>
<p style="font-size:13px;color:#454652;margin:0">View and handle daily luggage drop-offs and pick-ups efficiently.</p>
</div>
<div style="background:#f3f3f3;border-radius:12px;padding:20px">
<div style="background:#fff;padding:8px;border-radius:8px;display:inline-flex;margin-bottom:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">📷</div>
<h3 style="font-family:Manrope,sans-serif;font-weight:600;color:#1a1c1c;margin:0 0 4px;font-size:15px">Scan QR Codes</h3>
<p style="font-size:13px;color:#454652;margin:0">Quickly process customer check-ins and check-outs using the built-in scanner.</p>
</div>
</div>
<div style="text-align:center;margin-top:8px">
<a href="${link}" class="btn" style="background:linear-gradient(135deg,#000666,#1a237e);color:#fff;box-shadow:0 20px 40px rgba(26,35,126,0.15)">Accept Invitation →</a>
<p style="font-size:12px;color:#767683;margin-top:16px">Link expires in 48 hours. If you didn't expect this, please ignore this email.</p>
</div>
</div>
${this.foot()}`,
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
        html: `${this.head('')}
<div class="content">
<h1 style="font-size:28px;margin:0 0 4px;text-align:center">Booking Confirmed</h1>
<p style="text-align:center;margin:0 0 24px;font-size:14px">Your luggage is safe with us. Here is your receipt.</p>

<div style="display:flex;justify-content:space-between;background:#f9f9f9;padding:16px;border-radius:12px;margin-bottom:24px">
<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#454652;margin-bottom:4px">Booking ID</div><div style="font-family:Manrope,sans-serif;font-weight:700;font-size:18px;color:#1a237e">${booking.qrCode || `BK-${booking.id?.slice(0, 8)}`}</div></div>
<div style="text-align:right"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#454652;margin-bottom:4px">Date</div><div style="font-size:14px;color:#1a1c1c;font-weight:500">${startDate}</div></div>
</div>

<h2 style="font-size:20px;font-weight:700;color:#1a237e;border-bottom:1px solid #eee;padding-bottom:8px;margin:0 0 16px">Location Details</h2>
<div style="display:flex;gap:16px;margin-bottom:24px">
<div style="background:#e8e8e8;padding:12px;border-radius:50%;flex-shrink:0">🏪</div>
<div><h3 style="font-family:Manrope,sans-serif;font-weight:700;font-size:18px;color:#1a1c1c;margin:0 0 4px">${booking.location?.name || 'Store'}</h3><p style="font-size:13px;color:#454652;margin:0">${booking.location?.address || ''}</p></div>
</div>

<h2 style="font-size:20px;font-weight:700;color:#1a237e;border-bottom:1px solid #eee;padding-bottom:8px;margin:0 0 16px">Storage Summary</h2>
<div style="background:#f9f9f9;padding:20px;border-radius:12px;margin-bottom:24px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
<div style="display:flex;align-items:center;gap:12px"><span>📅</span><div><div style="font-size:14px;font-weight:500;color:#1a1c1c">Drop-off</div><div style="font-size:12px;color:#454652">${startDate}, ${startTime}</div></div></div>
<span style="color:#c6c5d4">→</span>
<div style="display:flex;align-items:center;gap:12px;text-align:right"><div><div style="font-size:14px;font-weight:500;color:#1a1c1c">Pick-up</div><div style="font-size:12px;color:#454652">${endDate}, ${endTime}</div></div><span>⏰</span></div>
</div>
${small > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid #eee"><div style="display:flex;align-items:center;gap:8px"><span style="color:#1a237e">🎒</span><span style="font-size:14px;color:#1a1c1c">Small Items</span></div><span style="font-family:Manrope,sans-serif;font-weight:700;color:#1a237e">x ${small}</span></div>` : ''}
${medium > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px"><div style="display:flex;align-items:center;gap:8px"><span style="color:#1a237e">🧳</span><span style="font-size:14px;color:#1a1c1c">Medium Suitcases</span></div><span style="font-family:Manrope,sans-serif;font-weight:700;color:#1a237e">x ${medium}</span></div>` : ''}
${large > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px"><div style="display:flex;align-items:center;gap:8px"><span style="color:#1a237e">🛄</span><span style="font-size:14px;color:#1a1c1c">Large Items</span></div><span style="font-family:Manrope,sans-serif;font-weight:700;color:#1a237e">x ${large}</span></div>` : ''}
</div>

<h2 style="font-size:20px;font-weight:700;color:#1a237e;border-bottom:1px solid #eee;padding-bottom:8px;margin:0 0 16px">Payment Breakdown</h2>
<div style="margin-bottom:24px">
<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#1a1c1c"><span>Subtotal</span><span style="font-weight:500">$${total}</span></div>
<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#454652"><span>Service Fee</span><span>$0.00</span></div>
<div style="display:flex;justify-content:space-between;padding:16px 0 0;border-top:1px solid #eee;font-family:Manrope,sans-serif;font-size:20px;font-weight:700;color:#1a237e"><span>Total Paid</span><span style="color:#9f4200">$${total}</span></div>
</div>

<div style="text-align:center;padding:24px 0 8px">
<a href="#" class="btn" style="background:linear-gradient(135deg,#000666,#1a237e);color:#fff;box-shadow:0 10px 20px rgba(26,35,126,0.15);gap:8px"><span>📱</span> View My Booking & QR Code</a>
<p style="font-size:12px;color:#767683;margin-top:16px">You will need the QR code to drop off and pick up your items.</p>
</div>
</div>
${this.foot()}`,
      });
    } catch (error) { this.logger.error('Error sending receipt email', error); }
  }
}
