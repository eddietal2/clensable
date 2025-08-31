import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db'; // adjust import to your prisma client path

export const POST: RequestHandler = async ({ request }) => {
  const { leadId, campaignId } = await request.json();

  if (!leadId || !campaignId) {
    return new Response(JSON.stringify({ error: 'Missing leadId or campaignId' }), { status: 400 });
  }

  try {
    const record = await prisma.campaignLeadBlacklist.create({
      data: {
        campaignId,
        placeId: leadId
      }
    });

    return new Response(JSON.stringify(record), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    // handle duplicate entry (P2002 is Prisma unique constraint error)
    if (err.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Lead already blacklisted' }), { status: 409 });
    }
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to blacklist lead' }), { status: 500 });
  }
};
