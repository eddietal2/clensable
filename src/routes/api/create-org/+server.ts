import { prisma } from '$lib/db';
import Stripe from 'stripe';
import type { RequestHandler } from './$types';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

    const { orgName, zip, serviceType, radius, stripeToken } = await request.json();

    if (!stripeToken) {
        return new Response(JSON.stringify({ error: 'No stripe token provided' }), { status: 400 });
    }

    // Create Stripe Customer and attach payment method
    const customer = await stripe.customers.create({
        email: locals.user.email,
        source: stripeToken,
        metadata: { userId: locals.user.id }
    });

    // Save org in database using the Stripe customer ID from backend
    const org = await prisma.org.create({
      data: {
        name: orgName,
        zip,
        serviceType,
        radius,
        stripeCustomerId: customer.id
      }
    });

    // Update user to belong to org
    await prisma.user.update({
        where: { id: locals.user.id },
        data: { orgId: org.id, hasOrg: true }
    });

    return new Response(JSON.stringify({ success: true, orgId: org.id }));
};
