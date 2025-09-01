import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/db';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  const { campaignId, leadId } = params;
  const user = locals.user;

  if (!user?.orgId) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    const lead = await prisma.outreachLead.findFirst({
      where: {
        id: leadId,
        outreachGroup: {
          campaignId: campaignId,
          campaign: { orgId: user.orgId }
        }
      },
      include: { outreachGroup: true }
    });

    if (!lead) return json({ error: 'Lead not found' }, { status: 404 });

    return json(lead);
  } catch (err) {
    console.error(err);
    return json({ error: 'Failed to fetch lead data' }, { status: 500 });
  }
};
