const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Format PH numbers from e.g. 09171234567 to +639171234567
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); // remove non-digits
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '+63' + cleaned.substring(1);
  }
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '+63' + cleaned;
  }
  // Default fallback (prefix with '+' if it doesn't have it and looks like a country code, or return as is)
  if (!phone.startsWith('+') && cleaned.length > 0) {
    return '+' + cleaned;
  }
  return phone;
}

async function sendEmailOtp(email, otp) {
  const isEnvConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  console.log('--------------------------------------------------');
  console.log(`✉️  [OTP EMAIL SENT TO: ${email}]`);
  console.log(`👉  VERIFICATION CODE: ${otp}`);
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

const verificationUrl = `${process.env.BACKEND_URL ||
  'http://localhost:5000'}/verify-email?token=${otp}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"MyTalipapa Recovery" <no-reply@mytalipapa.com>',
      to: email,
      subject: 'MyTalipapa - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfbf9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🏪</span>
            <h2 style="color: #1a5c2a; margin-top: 10px;">MyTalipapa</h2>
          </div>
          <h3 style="color: #374151;">Email Verification</h3>
          <p style="color: #4b5563; line-height: 1.6;">
            Please click the button below to verify your email address. This link will expire in 24 hours.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; font-size: 18px; color: #fff; background-color: #1a5c2a; border-radius: 8px; text-decoration: none;">
              Verify Email
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mocked: false };
  } catch (error) {
    console.error('Failed to send SMTP email:', error);
    throw error;
  }
}

async function sendSmsOtp(contactNumber, otp) {
  const formattedPhone = formatPhoneNumber(contactNumber);
  const isEnvConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;

  console.log('--------------------------------------------------');
  console.log(`📱  [OTP SMS SENT TO: ${formattedPhone} (Original: ${contactNumber})]`);
  console.log(`👉  VERIFICATION CODE: ${otp}`);
  console.log('--------------------------------------------------');

  if (!isEnvConfigured) {
    console.log('⚠️  Twilio credentials not set in .env. Mocking SMS delivery.');
    return { success: true, mocked: true };
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `[MyTalipapa] Your verification code is ${otp}. Valid for 10 minutes. Please do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    return { success: true, mocked: false };
  } catch (error) {
    console.error('Failed to send Twilio SMS:', error);
    throw error;
  }
}

module.exports = {
  sendEmailOtp,
  sendSmsOtp,
  formatPhoneNumber
};
