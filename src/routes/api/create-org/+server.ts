import { prisma } from '$lib/db';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // 1️⃣ Get the session token from cookies
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2️⃣ Validate session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken }
    });

    if (!session || session.expiresAt < new Date()) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.userId;

    // 3️⃣ Parse the POST body
    const body = await request.json();
    const { orgName, zip, serviceType, radius } = body;

    if (!orgName || !zip || !serviceType || !radius) {
      return json({ error: 'Missing fields' }, { status: 400 });
    }

    // 4️⃣ Create organization
    const org = await prisma.org.create({
      data: {
        name: orgName,
        users: {
          connect: { id: userId } // connect current user
        }
      },
      include: {
        users: true
      }
    });

    // 5️⃣ Update user to indicate they now have an org
    await prisma.user.update({
      where: { id: userId },
      data: {
        orgId: org.id,
        hasOrg: true
      }
    });

    // ✅ Success
    return json({ org });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
