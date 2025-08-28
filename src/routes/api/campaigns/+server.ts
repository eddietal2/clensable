import type { RequestHandler } from './$types';
import { prisma } from '$lib/db';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Get logged-in user
    const user = locals.user;
    if (!user || !user.orgId) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated or does not belong to an org' }),
        { status: 401 }
      );
    }

    // Fetch all campaigns for this org, include leads and outreach
    const campaigns = await prisma.campaign.findMany({
      where: { orgId: user.orgId },
      include: {
        leads: true,
        outreach: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return new Response(JSON.stringify(campaigns), { status: 200 });
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch campaigns' }),
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { name, description, targetZip, radius, category } = await request.json();

    const user = locals.user;
    if (!user || !user.orgId) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated or does not belong to an org' }),
        { status: 401 }
      );
    }

    if (!name || !targetZip || !radius || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        targetZip,
        radius,
        category,
        orgId: user.orgId
      }
    });

    return new Response(JSON.stringify(campaign), { status: 201 });
  } catch (err) {
    console.error('Error creating campaign:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create campaign' }),
      { status: 500 }
    );
  }
};