import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '$lib/email';

export const POST: RequestHandler = async ({ request }) => {
  const { email, firstName, lastName } = await request.json();

  if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
  }

  // Create user
  const user = await prisma.user.create({ data: { email, firstName, lastName } });

  // Generate magic token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.magicToken.create({ data: { token, userId: user.id, expiresAt } });

  const magicLink = `${import.meta.env.VITE_BASE_URL}/magic-login?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Welcome to Clensable – Your Magic Link',
    html: `<p>Click to log in: <a href="${magicLink}">${magicLink}</a></p>`
  });

  return new Response(JSON.stringify({ success: true }));
};
