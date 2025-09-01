import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  const user = locals.user;
  const { campaignId } = params;

  if (!user?.orgId) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    // Make sure the campaign belongs to the user's org
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, orgId: user.orgId },
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

    if (!campaign) return json({ error: 'Campaign not found' }, { status: 404 });
    // console.log(campaign);
    return json(campaign);
  } catch (err) {
    console.error(err);
    return json({ error: 'Failed to fetch campaign outreach groups' }, { status: 500 });
  }
};
