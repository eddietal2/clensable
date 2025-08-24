import type { PageServerLoad } from './$types';
import { prisma } from '$lib/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return { error: 'Invalid magic link.' };
  }

  // 1️⃣ Find token in DB
  const magicToken = await prisma.magicToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!magicToken) {
    return { error: 'Token not found.' };
  }

  // 2️⃣ Check if token is used or expired
  if (magicToken.used || magicToken.expiresAt < new Date()) {
    return { error: 'Token expired or already used.' };
  }

  // 3️⃣ Mark token as used
  await prisma.magicToken.update({
    where: { id: magicToken.id },
    data: { used: true }
  });

  // 4️⃣ Set session cookie (user is logged in)
  cookies.set('session', magicToken.user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD
  });

  // 5️⃣ Redirect to dashboard or home
  throw redirect(302, '/app'); 
};
