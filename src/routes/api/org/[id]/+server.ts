import { prisma } from '$lib/db'; // adjust path to your prisma client
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing org id' }), { status: 400 });
  }

  try {
    const org = await prisma.org.findUnique({
      where: { id },
      include: {
        users: true,
        campaigns: true,
      },
    });

    if (!org) {
      return new Response(JSON.stringify({ error: 'Org not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(org), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to fetch org details' }), { status: 500 });
  }
};
