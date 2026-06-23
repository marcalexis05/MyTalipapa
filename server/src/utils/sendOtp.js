const nodemailer = require('nodemailer');

/**
 * Send email OTP for verification or password reset
 * @param {string} email - Recipient email
 * @param {string} otp - For 'verify': verification token | For 'reset': 6-digit OTP
 * @param {string} type - 'verify' (registration) | 'reset' (forgot password)
 */
async function sendEmailOtp(email, otp, type = 'verify', fullName = '') {
  const isEnvConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  console.log('--------------------------------------------------');
  console.log(`[EMAIL SENT TO: ${email}] | TYPE: ${type.toUpperCase()}`);
  if (type === 'reset') {
    console.log(`4-DIGIT OTP: ${otp}`);
  } else {
    console.log(`VERIFICATION TOKEN: ${otp}`);
  }
  console.log('--------------------------------------------------');

  if (!isEnvConfigured) {
    console.log('SMTP credentials not set in .env. Mocking email delivery.');
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
      // Password Reset: 4-digit code (no emojis, humble and professional)
      subject = 'MyTalipapa - Password Reset Verification Code';
      emailHtml = `
        <div style="background-color: #f3f4f6; padding: 32px 16px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
            <!-- Header Banner -->
            <div style="background-color: #1a5c2a; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MyTalipapa</h1>
              <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Password Recovery Verification</p>
            </div>

            <!-- Content Area -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #1f2937; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
                Dear ${fullName || 'Valued Member'},
              </h2>
              
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
                We hope this email finds you well.
              </p>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                We received a request to verify your identity for resetting your MyTalipapa account password. To ensure the security of your account, please enter the four-digit verification code provided below in the recovery wizard:
              </p>

              <!-- OTP Box -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; padding: 18px 36px; font-size: 36px; font-family: 'Courier New', Courier, monospace; color: #1a5c2a; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; font-weight: 800; letter-spacing: 8px;">
                  ${otp}
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 12px; margin-bottom: 0;">
                  This security code is valid for 10 minutes.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #b45309; font-size: 12px; line-height: 1.5; margin: 0; font-weight: 500;">
                  <strong>Security Notice:</strong> Never share this code with anyone. MyTalipapa administration will never ask for your verification code.
                </p>
              </div>

              <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0;">
                If you did not request this, please secure your account or ignore this email.
              </p>

              <p style="color: #6b7280; font-size: 13px; font-weight: 600; margin-top: 16px; margin-bottom: 0;">
                Warm regards,<br>
                <span style="color: #1a5c2a;">MyTalipapa Management Team</span>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
                This email was sent automatically. Please do not reply.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
                © 2026 MyTalipapa. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // Email Verification: 4-digit code (no emojis, humble and professional)
      subject = 'MyTalipapa - Email Verification Code';
      emailHtml = `
        <div style="background-color: #f3f4f6; padding: 32px 16px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
            <!-- Header Banner -->
            <div style="background-color: #1a5c2a; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MyTalipapa</h1>
              <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Secure Portal Verification</p>
            </div>

            <!-- Content Area -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #1f2937; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
                Dear ${fullName || 'Valued Member'},
              </h2>
              
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
                We hope this email finds you well.
              </p>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                Welcome to MyTalipapa! We are truly excited to have you join our community. To complete your registration and secure your account, please verify your email address using the one-time verification code below:
              </p>

              <!-- OTP Box -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; padding: 18px 36px; font-size: 36px; font-family: 'Courier New', Courier, monospace; color: #1a5c2a; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; font-weight: 800; letter-spacing: 8px;">
                  ${otp}
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 12px; margin-bottom: 0;">
                  This verification code is valid for 24 hours.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #b45309; font-size: 12px; line-height: 1.5; margin: 0; font-weight: 500;">
                  <strong>Security Notice:</strong> Never share this code with anyone. MyTalipapa administration will never ask for your verification code.
                </p>
              </div>

              <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0;">
                Thank you for choosing MyTalipapa, and we wish you a wonderful experience ahead.
              </p>

              <p style="color: #6b7280; font-size: 13px; font-weight: 600; margin-top: 16px; margin-bottom: 0;">
                Warm regards,<br>
                <span style="color: #1a5c2a;">MyTalipapa Management Team</span>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
                If you did not initiate this registration request, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
                © 2026 MyTalipapa. All rights reserved.
              </p>
            </div>
          </div>
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