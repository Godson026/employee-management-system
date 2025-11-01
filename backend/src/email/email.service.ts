import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD');
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    // Log what we found
    this.logger.log('SMTP Configuration Check:');
    this.logger.log(`  SMTP_HOST: ${smtpHost ? '✓ Set' : '✗ Missing'}`);
    this.logger.log(`  SMTP_PORT: ${smtpPort ? `✓ ${smtpPort}` : '✗ Missing'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? '✓ Set' : '✗ Missing'}`);
    this.logger.log(`  SMTP_PASSWORD: ${smtpPass ? '✓ Set' : '✗ Missing'}`);
    this.logger.log(`  SMTP_SECURE: ${smtpSecure}`);

    // Only initialize if SMTP is configured
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      // Use Gmail service if it's Gmail (easier and more reliable)
      const isGmail = smtpHost.toLowerCase().includes('gmail.com');
      
      if (isGmail) {
        this.logger.log('Detected Gmail SMTP, using Gmail service configuration...');
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }

      // Verify connection
      this.transporter.verify().then(() => {
        this.logger.log('✅ SMTP transporter configured and verified successfully');
      }).catch((error) => {
        this.logger.error('❌ SMTP verification failed:', error.message || error);
        this.logger.error('Full error:', JSON.stringify(error, null, 2));
        this.logger.warn('⚠️  Email will fall back to console logging');
        this.transporter = null;
      });
    } else {
      this.logger.warn('⚠️  SMTP not fully configured. Missing required variables. Email will be logged to console only.');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName: string = 'there'): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER') || 'noreply@siclife.com';
    const subject = '🔒 Reset Your Password – Let\'s Get You Back In';
    const html = this.getPasswordResetEmailTemplate(resetUrl, firstName);

    // If SMTP is configured, send the email
    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: subject,
          html: html,
        });

        this.logger.log(`✅ Password reset email sent successfully to ${email}`);
        this.logger.log(`   Message ID: ${result.messageId}`);
        return;
      } catch (error: any) {
        this.logger.error(`❌ Failed to send password reset email to ${email}`);
        this.logger.error(`   Error: ${error.message || error}`);
        this.logger.error(`   Code: ${error.code || 'N/A'}`);
        if (error.response) {
          this.logger.error(`   Response: ${error.response}`);
        }
        this.logger.warn('⚠️  Falling back to console logging...');
        // Fall through to console logging as fallback
      }
    } else {
      this.logger.warn('⚠️  SMTP transporter not available. Logging email to console.');
    }

    // Fallback: Log to console (useful for development)
    this.logger.log(`Password reset email for ${email}:`);
    this.logger.log(`Reset URL: ${resetUrl}`);
    this.logger.log(`Token: ${resetToken}`);

    console.log('\n=== PASSWORD RESET EMAIL ===');
    console.log(`From: ${fromEmail}`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('===========================\n');
  }

  private getPasswordResetEmailTemplate(resetUrl: string, firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
              line-height: 1.7; 
              color: #1f2937; 
              margin: 0; 
              padding: 0; 
              background-color: #f9fafb;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header { 
              background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px; 
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
              font-weight: 500;
            }
            .message {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: linear-gradient(135deg, #059669 0%, #10b981 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .expiry-notice {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 25px 0;
              border-radius: 8px;
              font-size: 14px;
              color: #92400e;
            }
            .security-notice {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 25px 0;
              border-radius: 8px;
              font-size: 14px;
              color: #065f46;
            }
            .link-text {
              word-break: break-all; 
              color: #059669; 
              font-size: 12px;
              background: #ecfdf5;
              padding: 12px;
              border-radius: 6px;
              margin: 20px 0;
              border: 1px solid #d1fae5;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              color: #6b7280; 
              font-size: 14px; 
              padding: 30px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .signature {
              margin-top: 30px;
              padding-top: 25px;
              border-top: 1px solid #e5e7eb;
              color: #4b5563;
              font-size: 15px;
            }
            .signature strong {
              color: #059669;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Reset Your Password</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Hey ${firstName},
              </div>
              
              <div class="message">
                It looks like you requested to reset your password. No worries — we've got you covered.
              </div>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">👉 Reset My Password</a>
              </div>
              
              <div class="expiry-notice">
                <strong>⏰ Important:</strong> This link will expire in 30 minutes, so be sure to complete your reset soon.
              </div>
              
              <div class="security-notice">
                <strong>🔐 Security Note:</strong> If you didn't request this, you can safely ignore this email — your account is still secure.
              </div>
              
              <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <div class="link-text">${resetUrl}</div>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #059669;">Stay safe,</p>
              <p style="margin: 0; font-weight: 500; color: #1f2937;">The SIC Life Employee Management System Team</p>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                © 2025 SIC Life. All rights reserved.<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
