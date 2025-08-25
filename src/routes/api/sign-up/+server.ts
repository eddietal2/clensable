import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '$lib/email';
import type { User } from '@prisma/client';
let user: User | null = null;

export const POST: RequestHandler = async ({ request }) => {
  const { email, firstName, lastName } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
  }

  // Prepare token + expiry
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    // Transaction: create user + magic token
    await prisma.$transaction(async (tx) => {
      user = await tx.user.create({
        data: { email, firstName, lastName }
      });

      await tx.magicToken.create({
        data: { token, userId: user.id, expiresAt }
      });
    });
  } catch (error) {
    console.error("DB transaction failed:", error);
    return new Response(JSON.stringify({ error: 'Database error during signup' }), { status: 500 });
  }

  // Build magic link + email template
  const magicLink = `${process.env.VITE_BASE_URL}/magic-login?token=${token}`;
  const logo = "https://clensable.s3.us-east-1.amazonaws.com/logos/Complete_Logo_Green.png";

  try {
    await sendEmail({
      to: email,
      subject: 'Sign-Up / Your Clensable Magic Link',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logo}" alt="Clensable Logo" style="height: 50px;" />
          </div>
          <h2 style="color: #187967; text-align: center;">Welcome to Clensable 👋</h2>
          <p style="font-size: 16px; line-height: 1.5;">
            Click the button below to log in securely with your magic link:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
              style="background: linear-gradient(90deg, #00CF68, #187967); 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-size: 16px; 
                    font-weight: bold;">
              Log in to Clensable
            </a>
          </div>
          <p style="font-size: 14px; color: #555;">
            If the button doesn’t work, copy and paste this link into your browser:
            <br />
            <a href="${magicLink}" style="color: #187967;">${magicLink}</a>
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error("Email send failed:", error);

    // Rollback manually: delete user + tokens
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.magicToken.deleteMany({ where: { userId: user.id } });
    }

    return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }));
};
