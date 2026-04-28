import nodemailer, { Transporter } from 'nodemailer';
import config from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
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

export interface HostRegistrationPendingEmailData {
  email: string;
  firstName: string;
}

export interface HostVerificationStatusEmailData {
  email: string;
  firstName: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface BookingConfirmationEmailData {
  email: string;
  firstName: string;
  bookingCode: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress: string;
  hostPhone: string;
  totalPaid: string;
  currency: string;
  checkInInstructions?: string;
}

export interface BookingNotificationToHostData {
  email: string;
  hostName: string;
  bookingCode: string;
  startDate: string;
  endDate: string;
  locationName: string;
  customerName: string;
  customerPhone: string;
  carPlate: string;
  carModel?: string;
  amount: string;
  currency: string;
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
    const { to, subject, text, html, attachments } = options;

    // If not configured, log to console (useful for development)
    if (!this.isConfigured || !this.transporter) {
      console.log('=== EMAIL (Not Sent - SMTP not configured) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text || 'N/A'}`);
      console.log(`HTML: ${html ? 'Yes' : 'No'}`);
      console.log(`Attachments: ${attachments?.length || 0}`);
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
        attachments,
      });

      console.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendPayoutStatementEmail(data: { email: string; firstName: string; subject: string; text: string; pdf: Buffer; fileName: string }): Promise<boolean> {
    return this.sendEmail({
      to: data.email,
      subject: data.subject,
      text: data.text,
      attachments: [{ filename: data.fileName, content: data.pdf, contentType: 'application/pdf' }],
    });
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
- Book parking near Zurich Airport
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
      <li>Book parking near Zurich Airport</li>
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
   * Send host pending approval notification
   */
  async sendHostRegistrationPendingEmail(data: HostRegistrationPendingEmailData): Promise<boolean> {
    const subject = 'Ihr Host-Konto wird geprueft – Airport Parking';

    const text = `
Hallo ${data.firstName},

vielen Dank fuer Ihre Host-Registrierung.

Ihr Konto ist aktuell unter Pruefung. Sobald der Administrator Ihre Anfrage genehmigt,
erhalten Sie Zugriff auf das Host-Portal.

Mit freundlichen Gruessen,
Das Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host-Registrierung eingegangen</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B9AFF 0%, #1a6fd4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Airport Parking</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>
    <p>Vielen Dank fuer Ihre Host-Registrierung.</p>
    <p>Ihr Konto ist aktuell unter Pruefung. Sobald der Administrator Ihre Anfrage genehmigt, erhalten Sie Zugriff auf das Host-Portal.</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  /**
   * Send host approval/rejection email
   */
  async sendHostVerificationStatusEmail(data: HostVerificationStatusEmailData): Promise<boolean> {
    if (data.status === 'approved') {
      const portalUrl = `${config.frontendUrl}/host`;
      const subject = 'Ihr Host-Konto wurde genehmigt – Airport Parking';

      const text = `
Hallo ${data.firstName},

Ihr Host-Konto wurde genehmigt.
Sie koennen jetzt auf das Host-Portal zugreifen:
${portalUrl}

Mit freundlichen Gruessen,
Das Airport Parking Team
      `.trim();

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host-Konto genehmigt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #34c759 0%, #2fa04f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Host-Konto genehmigt</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>
    <p>Ihr Host-Konto wurde erfolgreich genehmigt.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background: #2fa04f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Zum Host-Portal
      </a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
      `.trim();

      return this.sendEmail({ to: data.email, subject, text, html });
    }

    const subject = 'Ihr Host-Konto wurde abgelehnt – Airport Parking';
    const reason = data.rejectionReason || 'Kein Grund angegeben';

    const text = `
Hallo ${data.firstName},

leider wurde Ihr Host-Konto abgelehnt.

Grund: ${reason}

Mit freundlichen Gruessen,
Das Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host-Konto abgelehnt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #e05252 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Host-Konto abgelehnt</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>
    <p>Leider wurde Ihr Host-Konto abgelehnt.</p>
    <div style="background: #fff1f1; border: 1px solid #ffd2d2; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Grund:</strong> ${reason}</p>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  /**
   * Send guest account credentials email to customer
   */
  async sendGuestCredentialsEmail(data: HostCredentialsEmailData): Promise<boolean> {
    const loginUrl = `${config.frontendUrl}/login`;

    const subject = 'Ihr Kundenkonto – Airport Parking';

    const text = `
Hallo ${data.firstName},

Vielen Dank für Ihre Buchung bei Airport Parking!

Wir haben für Sie automatisch ein Kundenkonto erstellt, damit Sie Ihre Buchungen verwalten können.

Ihre Zugangsdaten:

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
  <title>Ihr Kundenkonto</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B9AFF 0%, #667eea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Airport Parking</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>

    <p>Vielen Dank für Ihre Buchung bei Airport Parking!</p>
    <p>Wir haben für Sie automatisch ein Kundenkonto erstellt, damit Sie Ihre Buchungen jederzeit einsehen und verwalten können.</p>

    <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${data.email}</p>
      <p style="margin: 5px 0;"><strong>Passwort:</strong> ${data.tempPassword}</p>
    </div>

    <p style="color: #e74c3c; font-weight: bold;">Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #3B9AFF 0%, #667eea 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
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
   * Send booking confirmation email to customer
   */
  async sendBookingConfirmationToCustomer(data: BookingConfirmationEmailData): Promise<boolean> {
    const subject = `Buchungsbestätigung ${data.bookingCode} – Airport Parking`;

    const text = `
Hallo ${data.firstName},

Vielen Dank für Ihre Buchung bei Airport Parking!

Buchungscode: ${data.bookingCode}
Parkplatz: ${data.locationName}
Zeitraum: ${data.startDate} – ${data.endDate}
Bezahlter Betrag: ${data.currency} ${data.totalPaid}

Adresse des Parkplatzes:
${data.locationAddress}

Telefon des Hosts: ${data.hostPhone}
${data.checkInInstructions ? `\nCheck-in Anweisungen:\n${data.checkInInstructions}` : ''}

Bitte bewahren Sie diese E-Mail als Referenz auf.

Mit freundlichen Grüssen,
Das Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buchungsbestätigung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B9AFF 0%, #1a6fd4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Buchungsbestätigung</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.firstName}!</h2>

    <p>Vielen Dank für Ihre Buchung bei Airport Parking. Hier sind Ihre Buchungsdetails:</p>

    <div style="background: #f0f7ff; border: 1px solid #3B9AFF; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Buchungscode:</strong> ${data.bookingCode}</p>
      <p style="margin: 5px 0;"><strong>Parkplatz:</strong> ${data.locationName}</p>
      <p style="margin: 5px 0;"><strong>Zeitraum:</strong> ${data.startDate} – ${data.endDate}</p>
      <p style="margin: 5px 0;"><strong>Bezahlter Betrag:</strong> ${data.currency} ${data.totalPaid}</p>
    </div>

    <h3 style="color: #3B9AFF;">Anfahrt &amp; Kontakt</h3>
    <p><strong>Adresse:</strong> ${data.locationAddress}</p>
    <p><strong>Telefon des Hosts:</strong> ${data.hostPhone}</p>
    ${data.checkInInstructions ? `<h3 style="color: #3B9AFF;">Check-in Anweisungen</h3><p>${data.checkInInstructions}</p>` : ''}

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #888; font-size: 12px;">
      Bitte bewahren Sie diese E-Mail als Referenz auf. Bei Fragen kontaktieren Sie uns oder den Host direkt.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  /**
   * Send booking notification email to host
   */
  async sendBookingNotificationToHost(data: BookingNotificationToHostData): Promise<boolean> {
    const subject = `Neue Buchung ${data.bookingCode} – ${data.locationName}`;

    const text = `
Hallo ${data.hostName},

Sie haben eine neue Buchung erhalten!

Buchungscode: ${data.bookingCode}
Parkplatz: ${data.locationName}
Zeitraum: ${data.startDate} – ${data.endDate}

Kundendetails:
Name: ${data.customerName}
Telefon: ${data.customerPhone}
Kennzeichen: ${data.carPlate}
${data.carModel ? `Fahrzeug: ${data.carModel}` : ''}

Betrag: ${data.currency} ${data.amount}

Mit freundlichen Grüssen,
Das Airport Parking Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Buchung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B9AFF 0%, #1a6fd4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Neue Buchung</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo ${data.hostName}!</h2>

    <p>Sie haben eine neue Buchung für <strong>${data.locationName}</strong> erhalten.</p>

    <div style="background: #f0f7ff; border: 1px solid #3B9AFF; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Buchungscode:</strong> ${data.bookingCode}</p>
      <p style="margin: 5px 0;"><strong>Zeitraum:</strong> ${data.startDate} – ${data.endDate}</p>
      <p style="margin: 5px 0;"><strong>Betrag:</strong> ${data.currency} ${data.amount}</p>
    </div>

    <h3 style="color: #3B9AFF;">Kundendetails</h3>
    <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
      <p style="margin: 5px 0;"><strong>Telefon:</strong> ${data.customerPhone}</p>
      <p style="margin: 5px 0;"><strong>Kennzeichen:</strong> ${data.carPlate}</p>
      ${data.carModel ? `<p style="margin: 5px 0;"><strong>Fahrzeug:</strong> ${data.carModel}</p>` : ''}
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Airport Parking. Alle Rechte vorbehalten.</p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: data.email, subject, text, html });
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
