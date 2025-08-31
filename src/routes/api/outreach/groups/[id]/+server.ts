import type { RequestHandler } from '../$types';
import { prisma } from '$lib/db';

export const GET: RequestHandler = async ({ params }) => {
  const { campaignId } = params as { campaignId: string }; // <-- type assertion

  try {
    const groups = await prisma.outreachGroup.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' }
    });

    return new Response(JSON.stringify(groups.map(g => g.name)), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};
