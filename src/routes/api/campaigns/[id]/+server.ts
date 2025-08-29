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

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Campaign ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, category, targetZip, radius, status } = body;

    if (!name || !category || !targetZip) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Map status from frontend strings → Prisma enum
    const statusMap: Record<string, "DRAFT" | "ACTIVE" | "COMPLETED"> = {
      DRAFT: "DRAFT",
      ACTIVE: "ACTIVE",
      COMPLETED: "COMPLETED"
    };

    const prismaStatus = statusMap[status];
    if (!prismaStatus) {
      return new Response(JSON.stringify({ error: `Invalid status: ${status}` }), { status: 400 });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        description,
        category,
        targetZip,
        radius,
        status: prismaStatus
      }
    });

    return new Response(JSON.stringify(updatedCampaign), { status: 200 });
  } catch (err) {
    console.error('Error updating campaign:', err);
    return new Response(JSON.stringify({ error: 'Failed to update campaign' }), { status: 500 });
  }
};
