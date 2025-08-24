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

  await sendEmail({
    to: email,
    subject: 'Your Clensable Magic Link',
    html: `<p>Click to log in: <a href="${magicLink}">${magicLink}</a></p>`
  });

  return new Response(JSON.stringify({ success: true }));
};
