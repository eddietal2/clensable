import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db'; // adjust import to your prisma client path

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { campaignId } = params;
    if (!campaignId) return new Response('Missing campaignId', { status: 400 });

    const blacklisted = await prisma.campaignLeadBlacklist.findMany({
      where: { campaignId },
      select: { placeId: true }
    });

    return new Response(JSON.stringify(blacklisted.map(b => b.placeId)), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Failed to fetch blacklisted leads', { status: 500 });
  }
};
