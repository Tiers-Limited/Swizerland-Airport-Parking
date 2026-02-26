import nodemailer, { Transporter } from 'nodemailer';
import config from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface VerificationEmailData {
  email: string;
  firstName: string;
  verificationToken: string;
}

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetToken: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
}

export interface HostCredentialsEmailData {
  email: string;
  firstName: string;
  tempPassword: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter
   */
  private initializeTransporter(): void {
    // Check if email is configured
    if (!config.email.user || !config.email.password) {
      console.warn('Email service not configured. Emails will be logged to console.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, text, html } = options;

    // If not configured, log to console (useful for development)
    if (!this.isConfigured || !this.transporter) {
      console.log('=== EMAIL (Not Sent - SMTP not configured) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text || 'N/A'}`);
      console.log(`HTML: ${html ? 'Yes' : 'No'}`);
      console.log('==============================================');
      return true; // Return true in dev mode so the flow continues
    }

    try {
      await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${data.verificationToken}`;

    const subject = 'Verify Your Email - Airport Parking';
    
    const text = `
Hello ${data.firstName},

Thank you for registering with Airport Parking!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Airport Parking</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${data.firstName}!</h2>
    
    <p>Thank you for registering with Airport Parking!</p>
    
    <p>Please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    
    <p style="color: #666; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #888;">${verificationUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #888; font-size: 12px;">
      If you didn't create an account with Airport Parking, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${data.resetToken}`;

    const subject = 'Reset Your Password - Airport Parking';
    
    const text = `
Hello ${data.firstName},

We received a request to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Airport Parking</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${data.firstName}!</h2>
    
    <p>We received a request to reset your password.</p>
    
    <p>Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    
    <p style="color: #666; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #888;">${resetUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #888; font-size: 12px;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send welcome email (after email verification)
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const loginUrl = `${config.frontendUrl}/login`;
    const dashboardUrl = `${config.frontendUrl}/dashboard`;

    const subject = 'Welcome to Airport Parking!';
    
    const text = `
Hello ${data.firstName},

Welcome to Airport Parking! Your email has been verified and your account is now active.

You can now:
- Browse available parking spots near Zurich Airport
- Book parking with shuttle service
- Manage your reservations

Login to your account: ${loginUrl}

Best regards,
The Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Airport Parking</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${data.firstName}!</h2>
    
    <p>Your email has been verified and your Airport Parking account is now active!</p>
    
    <h3 style="color: #667eea;">What you can do now:</h3>
    <ul>
      <li>Browse available parking spots near Zurich Airport</li>
      <li>Book parking with shuttle service</li>
      <li>Manage your reservations</li>
      <li>Track your booking history</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="color: #666;">Thank you for choosing Airport Parking. We're excited to have you on board!</p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send host credentials email (when admin creates a host account)
   */
  async sendHostCredentialsEmail(data: HostCredentialsEmailData): Promise<boolean> {
    const loginUrl = `${config.frontendUrl}/login`;

    const subject = 'Ihr Host-Konto – Airport Parking';

    const text = `
Hallo ${data.firstName},

Ihr Host-Konto bei Airport Parking wurde erstellt.

Hier sind Ihre Zugangsdaten:

E-Mail: ${data.email}
Passwort: ${data.tempPassword}

Bitte melden Sie sich an und ändern Sie Ihr Passwort: ${loginUrl}

Mit freundlichen Grüssen,
Das Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihr Host-Konto</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Airport Parking</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>

    <p>Ihr Host-Konto bei Airport Parking wurde erfolgreich erstellt.</p>

    <p>Hier sind Ihre Zugangsdaten:</p>

    <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${data.email}</p>
      <p style="margin: 5px 0;"><strong>Passwort:</strong> ${data.tempPassword}</p>
    </div>

    <p style="color: #e74c3c; font-weight: bold;">Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Jetzt anmelden
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Falls Sie den Button nicht anklicken können, kopieren Sie diesen Link in Ihren Browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #888;">${loginUrl}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
