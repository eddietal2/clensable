import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    // Skip redirect if we're already on the "create org" page
    if (!locals.user.orgId && !url.pathname.startsWith('/app/create-org')) {
        throw redirect(302, '/app/create-org');
    }

    return { user: locals.user };
};
