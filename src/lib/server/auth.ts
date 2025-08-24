import { prisma } from '$lib/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function getUserFromSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function requireAuth(event: RequestEvent) {
  const token = event.cookies.get('session');
  if (!token) throw redirectToLogin();

  const user = await getUserFromSession(token);
  if (!user) throw redirectToLogin();

  event.locals.user = user;
  return user;
}

function redirectToLogin() {
  return new Response(null, {
    status: 302,
    headers: { location: '/login' }
  });
}
