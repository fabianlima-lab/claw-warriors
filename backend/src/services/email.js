import { Resend } from 'resend';
import env from '../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Use Resend default domain until custom domain is verified
const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'ClawWarriors <onboarding@resend.dev>';

/**
 * Send a password reset email with a link to reset the password.
 * @param {string} to — recipient email
 * @param {string} token — raw (unhashed) reset token
 */
export async function sendPasswordResetEmail(to, token) {
  if (!resend) {
    console.error('[EMAIL] Resend not configured (missing RESEND_API_KEY)');
    return false;
  }

  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your ClawWarriors password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #e8632b; margin-bottom: 24px;">Reset Your Password</h2>
          <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset your ClawWarriors password. Click the button below to set a new one.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #e8632b; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #aaa; font-size: 12px;">ClawWarriors — Your AI Warrior, Your Rules</p>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL] send failed:', error);
      return false;
    }

    console.log(`[EMAIL] reset email sent to: ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error('[EMAIL] send error:', err.message);
    return false;
  }
}

export function isEmailConfigured() {
  return !!resend;
}
