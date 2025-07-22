import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }) {
    try {
      const from = options.from || this.configService.get<string>('SMTP_FROM_EMAIL') || 'noreply@mangastore.com';
      
      const result = await this.resend.emails.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent successfully: ${result.data?.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(to: string, token: string, name?: string) {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Manga Store</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; text-align: center; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Manga Store</h1>
              <h2>Welcome ${name ? name : 'to our community'}!</h2>
            </div>
            <div class="content">
              <h3>Verify Your Email Address</h3>
              <p>Thank you for joining Manga Store! To complete your registration and start exploring our amazing manga collection, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Manga Store. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Verify Your Email Address - Manga Store',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, name?: string) {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Manga Store</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; text-align: center; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
              <h2>Manga Store</h2>
            </div>
            <div class="content">
              <h3>Hello ${name ? name : 'there'},</h3>
              <p>We received a request to reset the password for your Manga Store account.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour for your security</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              
              <p>For your account's security, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication</li>
                <li>Not sharing your login credentials</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2025 Manga Store. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Reset Your Password - Manga Store',
      html,
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Manga Store!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; text-align: center; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; }
            .features { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Manga Store!</h1>
              <h2>Hello ${name}!</h2>
            </div>
            <div class="content">
              <h3>Your account has been verified successfully!</h3>
              <p>We're excited to have you join our manga-loving community. You now have access to:</p>
              
              <div class="features">
                <div class="feature">
                  <h4>📚 Vast Collection</h4>
                  <p>Browse thousands of manga titles from various genres</p>
                </div>
                <div class="feature">
                  <h4>💖 Wishlist</h4>
                  <p>Save your favorite manga for later</p>
                </div>
                <div class="feature">
                  <h4>⭐ Reviews</h4>
                  <p>Share your thoughts and read others' reviews</p>
                </div>
                <div class="feature">
                  <h4>🛒 Easy Shopping</h4>
                  <p>Quick and secure checkout process</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Start Shopping</a>
              </div>
              
              <p>Need help getting started? Check out our:</p>
              <ul>
                <li><a href="${this.configService.get<string>('FRONTEND_URL')}/help/getting-started">Getting Started Guide</a></li>
                <li><a href="${this.configService.get<string>('FRONTEND_URL')}/contact">Customer Support</a></li>
                <li><a href="${this.configService.get<string>('FRONTEND_URL')}/manga/popular">Popular Manga</a></li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2025 Manga Store. All rights reserved.</p>
              <p>Follow us on social media for the latest updates!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Manga Store! 🎉',
      html,
    });
  }
}
