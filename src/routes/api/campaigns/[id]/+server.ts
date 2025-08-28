import type { RequestHandler } from './$types';
import { prisma } from '$lib/db';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Campaign ID is required' }), { status: 400 });
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { leads: true, outreach: true } // include relations if needed
    });

    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(campaign), { status: 200 });
  } catch (err) {
    console.error('Error fetching campaign:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch campaign' }), { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Campaign ID is required' }), { status: 400 });
  }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
    }

    await prisma.campaign.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete campaign' }), { status: 500 });
  }
};
