import type { PageServerLoad } from './$types';
import { prisma } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user?.orgId) return { org: null };

  const org = await prisma.org.findUnique({
    where: { id: locals.user.orgId },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true } },
      campaigns: { select: { id: true, name: true } }
    }
  });

  return { org };
};
