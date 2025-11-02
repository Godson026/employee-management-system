import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private emailMethod: 'resend' | 'smtp' | 'console' = 'console';

  constructor(private configService: ConfigService) {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    // Check for Resend first (preferred method - works on Railway)
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        this.resend = new Resend(resendApiKey);
        this.emailMethod = 'resend';
        this.logger.log('✅ Resend email service initialized (preferred method)');
        this.logger.log('   This will work on Railway and other cloud platforms');
        return;
      } catch (error) {
        this.logger.error('Failed to initialize Resend:', error);
      }
    } else {
      this.logger.log('ℹ️  RESEND_API_KEY not found, trying SMTP fallback...');
    }

    // Fallback to SMTP if Resend is not configured
    this.initializeSMTP();
  }

  private initializeSMTP() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD');
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    this.logger.log('SMTP Configuration Check:');
    this.logger.log(`  SMTP_HOST: ${smtpHost ? '✓ Set' : '✗ Missing'}`);
    this.logger.log(`  SMTP_PORT: ${smtpPort ? `✓ ${smtpPort}` : '✗ Missing'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? '✓ Set' : '✗ Missing'}`);
    this.logger.log(`  SMTP_PASSWORD: ${smtpPass ? '✓ Set' : '✗ Missing'}`);

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const isGmail = smtpHost.toLowerCase().includes('gmail.com');
      
      if (isGmail) {
        this.logger.log('Detected Gmail SMTP, using Gmail service configuration...');
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
      }

      this.emailMethod = 'smtp';
      this.logger.log('✅ SMTP transporter configured (may not work on Railway due to port blocking)');
    } else {
      this.logger.warn('⚠️  No email service configured. Emails will be logged to console only.');
      this.logger.warn('   To enable email sending:');
      this.logger.warn('   1. Get a Resend API key from https://resend.com (recommended)');
      this.logger.warn('   2. Add RESEND_API_KEY to your Railway environment variables');
      this.emailMethod = 'console';
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName: string = 'there'): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const subject = '🔒 Reset Your Password – Let\'s Get You Back In';
    const html = this.getPasswordResetEmailTemplate(resetUrl, firstName);

    // Try Resend first (works on Railway)
    if (this.emailMethod === 'resend' && this.resend) {
      // Determine FROM email - prefer verified domain, fallback to test domain
      let fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 
                     this.configService.get<string>('SMTP_FROM') || 
                     'onboarding@resend.dev';
      
      // If custom domain, try it first; if it fails, fallback to test domain
      const customDomain = fromEmail !== 'onboarding@resend.dev';
      
      try {
        this.logger.log(`📧 Attempting to send email via Resend...`);
        this.logger.log(`   From: ${fromEmail}`);
        this.logger.log(`   To: ${email}`);
        
        const result = await this.resend.emails.send({
          from: fromEmail,
          to: email,
          subject: subject,
          html: html,
        });
        
        if (result.error) {
          // If domain not verified and we used a custom domain, retry with test domain
          if (result.error.statusCode === 403 && 
              result.error.message?.includes('domain is not verified') && 
              customDomain) {
            this.logger.warn(`   ⚠️ Custom domain not verified. Retrying with Resend test domain...`);
            fromEmail = 'onboarding@resend.dev';
            
            const retryResult = await this.resend.emails.send({
              from: fromEmail,
              to: email,
              subject: subject,
              html: html,
            });
            
            if (retryResult.error) {
              this.logger.error(`   ⚠️ Resend error (even with test domain): ${JSON.stringify(retryResult.error)}`);
              throw new Error(`Resend error: ${retryResult.error.message || JSON.stringify(retryResult.error)}`);
            }
            
            this.logger.log(`✅ Password reset email sent successfully via Resend (using test domain) to ${email}`);
            if (retryResult.data?.id) {
              this.logger.log(`   Message ID: ${retryResult.data.id}`);
            }
            this.logger.warn(`   💡 Tip: Verify your domain at https://resend.com/domains to use your custom email address`);
            return;
          }
          
          this.logger.error(`   ⚠️ Resend returned an error: ${JSON.stringify(result.error)}`);
          throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
        }

        this.logger.log(`✅ Password reset email sent successfully via Resend to ${email}`);
        if (result.data?.id) {
          this.logger.log(`   Message ID: ${result.data.id}`);
        } else {
          this.logger.warn(`   ⚠️ No message ID in response - email may not have been sent`);
        }
        
        return;
      } catch (error: any) {
        this.logger.error(`❌ Failed to send email via Resend to ${email}`);
        this.logger.error(`   Error: ${error.message || error}`);
        this.logger.warn('⚠️  Falling back to console logging...');
        // Fall through to console logging
      }
    }

    // Fallback to SMTP
    if (this.emailMethod === 'smtp' && this.transporter) {
      try {
        const fromEmail = this.configService.get<string>('SMTP_FROM') || 
                         this.configService.get<string>('SMTP_USER') || 
                         'noreply@siclife.com';

        const sendPromise = this.transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: subject,
          html: html,
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
        );
        
        const result = await Promise.race([sendPromise, timeoutPromise]) as any;

        this.logger.log(`✅ Password reset email sent successfully via SMTP to ${email}`);
        this.logger.log(`   Message ID: ${result.messageId}`);
        return;
      } catch (error: any) {
        this.logger.error(`❌ Failed to send email via SMTP to ${email}`);
        this.logger.error(`   Error: ${error.message || error}`);
        this.logger.error(`   Code: ${error.code || 'N/A'}`);
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
          this.logger.error('   Railway is likely blocking SMTP connections.');
          this.logger.error('   Please use Resend instead (add RESEND_API_KEY to Railway).');
        }
        this.logger.warn('⚠️  Falling back to console logging...');
        // Fall through to console logging
      }
    }

    // Final fallback: Log to console
    this.logger.warn('⚠️  Email service not available. Logging password reset email to console:');
    this.logger.log(`Password reset email for ${email}:`);
    this.logger.log(`Reset URL: ${resetUrl}`);
    this.logger.log(`Token: ${resetToken}`);

    console.log('\n=== PASSWORD RESET EMAIL ===');
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
              <p style="margin: 0; font-weight: 500; color: #1f2937;">The SIC Life Staff Portal Team</p>
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
