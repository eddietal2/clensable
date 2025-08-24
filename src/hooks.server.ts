import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');

  if (token) {
    const user = await getUserFromSession(token);
    if (user) event.locals.user = user;
  }

  return await resolve(event);
};
