import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  // User must be logged in
  const user = locals.user;
  if (!user?.orgId) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    // Fetch campaigns of the user's org including outreach groups and their leads
    const campaigns = await prisma.campaign.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true,
        name: true,
        outreach: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            leads: {
              select: {
                id: true,
                placeId: true,
                leadData: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    // Group outreach by campaign
    const outreachByCampaign = campaigns.map((c) => ({
      campaignId: c.id,
      campaignName: c.name,
      outreachGroups: c.outreach
    }));
    console.log(outreachByCampaign);
    
    return json(outreachByCampaign);
  } catch (err) {
    console.error(err);
    return json({ error: 'Failed to fetch outreach groups' }, { status: 500 });
  }
};
