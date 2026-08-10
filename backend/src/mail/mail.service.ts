import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private async getTransporter() {
    const smtpHost = (await this.settingsService.getSetting('smtpHost')) || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = (await this.settingsService.getSetting('smtpPort')) || process.env.SMTP_PORT || 587;
    const smtpUser = (await this.settingsService.getSetting('smtpUser')) || process.env.SMTP_USER || '';
    const smtpPass = (await this.settingsService.getSetting('smtpPass')) || process.env.SMTP_PASS || '';
    const smtpSecure = (await this.settingsService.getSetting('smtpSecure')) ?? (process.env.SMTP_SECURE === 'true' || Number(smtpPort) === 465);

    return {
      transporter: nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Boolean(smtpSecure),
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
        tls: { rejectUnauthorized: false },
      }),
      fromAddress: (await this.settingsService.getSetting('smtpFrom')) || process.env.SMTP_FROM || `Hoorain Finance <${smtpUser || 'noreply@hoorain.app'}>`,
      smtpHost,
    };
  }

  async verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { transporter, smtpHost } = await this.getTransporter();
      await transporter.verify();
      return { success: true, message: `Successfully connected to SMTP server at ${smtpHost}` };
    } catch (err: any) {
      this.logger.error(`SMTP verification failed: ${err.message}`);
      return { success: false, message: `SMTP Connection Error: ${err.message}` };
    }
  }

  async sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const { transporter, fromAddress } = await this.getTransporter();
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'Hoorain Finance - SMTP Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #10b981;">SMTP Email Server Test</h2>
            <p>Your SMTP mail configuration on <strong>Hoorain Finance</strong> is working perfectly!</p>
            <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      });
      return { success: true, message: `Test email sent successfully to ${toEmail}` };
    } catch (err: any) {
      this.logger.error(`Failed to send test email: ${err.message}`);
      return { success: false, message: `Failed to send email: ${err.message}` };
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const { transporter, fromAddress } = await this.getTransporter();
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'Hoorain Finance - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
            <h2 style="color: #6366f1; margin-top: 0;">Password Reset Verification</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We received a request to reset the password for your Hoorain Finance account. Use the authorization code below to set a new password:
            </p>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 12px; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${resetCode}</span>
            </div>
            <p style="color: #64748b; font-size: 12px;">
              This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.
            </p>
          </div>
        `,
      });
      return { success: true, message: `Password reset email sent to ${toEmail}` };
    } catch (err: any) {
      this.logger.warn(`Could not send password reset email via SMTP: ${err.message}`);
      return { success: false, message: `Could not send reset email: ${err.message}` };
    }
  }
}
