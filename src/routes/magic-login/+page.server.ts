import type { PageServerLoad } from './$types';
import { prisma } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = url.searchParams.get('token');
  if (!token) return { error: 'Invalid magic link.' };

  const magicToken = await prisma.magicToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!magicToken) return { error: 'Token not found.' };
  if (magicToken.used || magicToken.expiresAt < new Date())
    return { error: 'Token expired or already used.' };

  await prisma.magicToken.update({
    where: { id: magicToken.id },
    data: { used: true }
  });

  // ✅ Create a session token
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      token: sessionToken,
      userId: magicToken.user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min
    }
  });

  cookies.set('session', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD
  });

  throw redirect(302, '/app');
};