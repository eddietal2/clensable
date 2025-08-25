import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '$lib/email';

export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
  }

  // ✅ Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return new Response(JSON.stringify({ error: 'No account found with this email' }), { status: 404 });
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  // User has 15 minutes to use the magic link
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);


  await prisma.magicToken.create({
    data: { token, userId: user.id, expiresAt }
  });

  const magicLink = `${import.meta.env.VITE_BASE_URL}/magic-login?token=${token}`;
  const logo = "https://clensable.s3.us-east-1.amazonaws.com/logos/Complete_Logo_Green.png"

  await sendEmail({
  to: email,
  subject: 'Log In / Your Clensable Magic Link',
  html: `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${logo}" alt="Clensable Logo" style="height: 50px;" />
    </div>
    <h2 style="color: #187967; text-align: center;">Log In to Clensable 💻</h2>
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


  return new Response(JSON.stringify({ success: true }));
};
