import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serverModule from '../../src/routes/api/magic-link/+server';
import { prisma } from '$lib/db';
import * as emailModule from '$lib/email';

// Mock Prisma & email
vi.mock('$lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    magicToken: { create: vi.fn() }
  }
}));

vi.mock('$lib/email', () => ({
  sendEmail: vi.fn()
}));

// Helper to create a mock RequestEvent
function createMockEvent(body: any) {
  return {
    request: { json: async () => body },
    cookies: {},
    fetch: vi.fn(),
    getClientAddress: vi.fn(),
    locals: {},
    params: {},
    platform: {},
    route: { id: '/api/magic-link' },
    url: new URL('http://localhost/api/magic-link')
  } as any;
}

describe('/api/magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if email is missing', async () => {
    const event = createMockEvent({});
    const response = await serverModule.POST(event);
    const data = JSON.parse(await response.text());

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('returns 404 if user does not exist', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const event = createMockEvent({ email: 'missing@example.com' });
    const response = await serverModule.POST(event);
    const data = JSON.parse(await response.text());

    expect(response.status).toBe(404);
    expect(data.error).toBe('No account found with this email');
  });

  it('creates a magic token and sends email for existing user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user1', email: 'test@example.com' });
    (prisma.magicToken.create as any).mockResolvedValue(true);
    (emailModule.sendEmail as any).mockResolvedValue(true);

    const event = createMockEvent({ email: 'test@example.com' });
    const response = await serverModule.POST(event);
    const data = JSON.parse(await response.text());

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(prisma.magicToken.create).toHaveBeenCalled();
    expect(emailModule.sendEmail).toHaveBeenCalled();
  });
});
