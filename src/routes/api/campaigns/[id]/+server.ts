import type { RequestHandler } from './$types';
import { prisma } from '$lib/db';

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Campaign ID is required' }), { status: 400 });
  }

  try {
    // Optional: Check if campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
    }

    // Delete the campaign
    await prisma.campaign.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete campaign' }), { status: 500 });
  }
};