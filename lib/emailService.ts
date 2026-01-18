/**
 * Email service for sending verification codes
 * Uses Resend API (https://resend.com)
 * 
 * Setup:
 * 1. Sign up at https://resend.com (free tier: 3,000 emails/month)
 * 2. Get your API key from dashboard
 * 3. Update RESEND_API_KEY and FROM_EMAIL below
 * 
 * Note: For production, consider using Firebase Cloud Functions to keep API key secure
 */

// Resend API key
const RESEND_API_KEY = 're_e3EqD8NA_EMmspbc5cNxnkesNe197veYT';
const RESEND_API_URL = 'https://api.resend.com/emails';
// Use Resend's default domain for testing, or replace with your verified domain
const FROM_EMAIL = 'DailyVibe <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
      console.warn('Resend API key not configured. Email sending disabled.');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('Sending email via Resend API to:', options.to);
    console.log('From email:', FROM_EMAIL);

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const responseData = await response.json().catch(() => ({}));
    console.log('Resend API response status:', response.status);
    console.log('Resend API response data:', responseData);

    if (!response.ok) {
      console.error('Resend API error:', responseData);
      return { success: false, error: responseData.message || 'Failed to send email' };
    }

    console.log('Email sent successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Verify your DailyVibe account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">DailyVibe</h1>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Please enter the following verification code in the app to verify your email address:
        </p>
        
        <div style="background-color: #ffffff; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
          This code will expire in 10 minutes.
        </p>
      </div>
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
        If you didn't create a DailyVibe account, you can safely ignore this email.
      </p>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
