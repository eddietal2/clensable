// tests/server/magic-login.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from '../../src/routes/magic-login/+page.server';
import { prisma } from '$lib/db';

vi.mock('$lib/db', () => ({
  prisma: {
    magicToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

describe('magic-login PageServerLoad', () => {
  let mockCookies: any;
  let createMockEvent: (urlString: string) => any;

  beforeEach(() => {
    mockCookies = { set: vi.fn() };
    vi.clearAllMocks();

    createMockEvent = (urlString: string) => {
      const url = new URL(urlString);
      return {
        url,
        cookies: mockCookies,
        params: {},
        routeId: '/magic-login',
        request: {} as any,
        locals: {} as any,
        parent: vi.fn(),
        depends: vi.fn(),
        untrack: vi.fn(),
        tracing: {} as any,
        platform: {} as any,
        setHeaders: vi.fn(),
        isDataRequest: false,
      };
    };
  });

  it('returns error if token is missing', async () => {
    const mockEvent = createMockEvent('http://localhost');
    const result = await load(mockEvent) as any;;
    expect(result.error).toBe('Invalid magic link.');
  });

  it('returns error if token not found', async () => {
    const mockEvent = createMockEvent('http://localhost?token=abc');
    (prisma.magicToken.findUnique as any).mockResolvedValue(null);

    const result = await load(mockEvent) as any;;
    expect(result.error).toBe('Token not found.');
  });

  it('returns error if token is used', async () => {
    const mockEvent = createMockEvent('http://localhost?token=abc');
    (prisma.magicToken.findUnique as any).mockResolvedValue({
      id: '1',
      used: true,
      expiresAt: new Date(Date.now() + 10000),
      user: { id: 'user1' },
    });

    const result = await load(mockEvent) as any;;
    expect(result.error).toBe('Token expired or already used.');
  });

  it('returns error if token is expired', async () => {
    const mockEvent = createMockEvent('http://localhost?token=abc');
    (prisma.magicToken.findUnique as any).mockResolvedValue({
      id: '1',
      used: false,
      expiresAt: new Date(Date.now() - 10000),
      user: { id: 'user1' },
    });

    const result = await load(mockEvent) as any;;
    expect(result.error).toBe('Token expired or already used.');
  });

  it('sets session cookie and updates token for valid token', async () => {
    const mockEvent = createMockEvent('http://localhost?token=abc');
    const tokenData = {
      id: 'token1',
      used: false,
      expiresAt: new Date(Date.now() + 10000),
      user: { id: 'user1' },
    };

    (prisma.magicToken.findUnique as any).mockResolvedValue(tokenData);
    (prisma.magicToken.update as any).mockResolvedValue({ ...tokenData, used: true });
    (prisma.session.create as any).mockResolvedValue({ token: 'session123' });

    let redirectError;
    try {
      await load(mockEvent);
    } catch (err: any) {
      redirectError = err;
    }

    expect(prisma.magicToken.update).toHaveBeenCalledWith({
      where: { id: tokenData.id },
      data: { used: true },
    });

    expect(prisma.session.create).toHaveBeenCalled();
    expect(mockCookies.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ path: '/', httpOnly: true })
    );

    expect(redirectError?.status).toBe(302);
    expect(redirectError?.location).toBe('/app');
  });
});
