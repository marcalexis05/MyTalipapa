const nodemailer = require('nodemailer');

/**
 * Send email OTP for verification or password reset
 * @param {string} email - Recipient email
 * @param {string} otp - For 'verify': verification token | For 'reset': 6-digit OTP
 * @param {string} type - 'verify' (registration) | 'reset' (forgot password)
 */
async function sendEmailOtp(email, otp, type = 'verify') {
  const isEnvConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  console.log('--------------------------------------------------');
  console.log(`✉️  [EMAIL SENT TO: ${email}] | TYPE: ${type.toUpperCase()}`);
  if (type === 'reset') {
    console.log(`👉  6-DIGIT OTP: ${otp}`);
  } else {
    console.log(`👉  VERIFICATION TOKEN: ${otp}`);
  }
  console.log('--------------------------------------------------');

  if (!isEnvConfigured) {
    console.log('⚠️  SMTP credentials not set in .env. Mocking email delivery.');
    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    let subject = '';
    let emailHtml = '';

    if (type === 'reset') {
      // ━━━━━ PASSWORD RESET: 6-DIGIT OTP ━━━━━
      subject = 'MyTalipapa - Password Reset OTP';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfbf9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🏪</span>
            <h2 style="color: #1a5c2a; margin-top: 10px;">MyTalipapa</h2>
          </div>
          <h3 style="color: #374151;">🔐 Password Reset Request</h3>
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your password. Use the 6-digit code below to proceed. <strong>This code is valid for 10 minutes.</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 16px 28px; font-size: 32px; font-family: 'Courier New', monospace; color: #1a5c2a; background-color: #f0fdf4; border: 2px dashed #1a5c2a; border-radius: 8px; font-weight: bold; letter-spacing: 8px;">
              ${otp}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            ⚠️ <strong>Never share this code with anyone.</strong> MyTalipapa staff will never ask for your OTP.
          </p>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            If you did not request a password reset, please ignore this email or secure your account if you suspect unauthorized activity.
          </p>
        </div>
      `;
    } else {
      // ━━━━━ EMAIL VERIFICATION: VERIFICATION LINK ━━━━━
      subject = 'MyTalipapa - Email Verification';
      const verificationUrl = `${clientUrl}/verify-email?token=${otp}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfbf9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🏪</span>
            <h2 style="color: #1a5c2a; margin-top: 10px;">MyTalipapa</h2>
          </div>
          <h3 style="color: #374151;">✉️ Email Verification</h3>
          <p style="color: #4b5563; line-height: 1.6;">
            Welcome to MyTalipapa! Please verify your email address by clicking the button below to activate your account. <strong>This link will expire in 24 hours.</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; font-size: 16px; color: #fff; background-color: #1a5c2a; border-radius: 8px; text-decoration: none; font-weight: bold; transition: background-color 0.3s;">
              ✓ Verify Email Address
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 20px 0;">
            Or copy and paste this link in your browser:<br>
            <span style="color: #1a5c2a; word-break: break-all; font-family: monospace; font-size: 11px;">${verificationUrl}</span>
          </p>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            If you did not create this account, please ignore this email.
          </p>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"MyTalipapa" <no-reply@mytalipapa.com>',
      to: email,
      subject: subject,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mocked: false };
  } catch (error) {
    console.error('Failed to send SMTP email:', error);
    throw error;
  }
}

module.exports = {
  sendEmailOtp
};