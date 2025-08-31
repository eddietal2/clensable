import type { RequestHandler } from './$types';
import { prisma } from '$lib/db'; // make sure you have Prisma client setup

type Lead = {
    id: string; // Google Place ID
    name: string;
    address?: string;
    phone?: string;
    websiteUri?: string;
    generativeSummary?: any;
    photoUrls?: string[];
};

type AddLeadPayload = {
    campaignId: string;
    groupName: string;
    description?: string;
    lead: Lead;
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { campaignId, groupName, description, lead }: AddLeadPayload = await request.json();

        // 1️⃣ Find or create OutreachGroup
        let outreachGroup = await prisma.outreachGroup.findFirst({
            where: {
                campaignId,
                name: groupName
            }
        });

        if (!outreachGroup) {
            outreachGroup = await prisma.outreachGroup.create({
                data: {
                    campaignId,
                    name: groupName,
                    description: description ?? ''
                }
            });
        }

        // 2️⃣ Add lead to group, ignoring if already exists (unique constraint)
        const newLead = await prisma.outreachLead.upsert({
            where: {
                outreachGroupId_placeId: {
                    outreachGroupId: outreachGroup.id,
                    placeId: lead.id
                }
            },
            update: {}, // do nothing if already exists
            create: {
                outreachGroupId: outreachGroup.id,
                placeId: lead.id,
                leadData: lead,
                status: 'pending'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            group: outreachGroup,
            addedLead: newLead
        }), { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({
            success: false,
            error: (err as Error).message
        }), { status: 500 });
    }
};
