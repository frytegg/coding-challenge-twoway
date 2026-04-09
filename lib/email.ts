import { createTransport } from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  if (!process.env.SMTP_HOST) {
    console.log(`📧 [DEV] Verification link: ${verifyUrl}`);
    return;
  }

  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; color: #111;">Verify your PromptVault account</h1>
  <p style="color: #555; line-height: 1.5;">
    Click the button below to verify your email address and activate your account.
  </p>
  <a href="${verifyUrl}"
     style="display: inline-block; padding: 12px 24px; background: #111; color: #fff;
            text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
    Verify Email
  </a>
  <p style="color: #999; font-size: 13px;">
    If you didn't create an account, you can safely ignore this email.
    This link expires in 24 hours.
  </p>
</body>
</html>`.trim();

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@promptvault.app',
    to: email,
    subject: 'Verify your PromptVault account',
    html,
  });
}
