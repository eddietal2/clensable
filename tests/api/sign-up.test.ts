import { describe, it, vi, beforeEach, expect } from 'vitest';
import * as serverModule from '../../src/routes/api/sign-up/+server';
import { prisma } from '$lib/db';
import { sendEmail } from '$lib/email';
import { randomBytes } from 'crypto';

vi.mock('$lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    },
    magicToken: {
      create: vi.fn(),
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('$lib/email', () => ({
  sendEmail: vi.fn()
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn()
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});


// Missing email
it('returns 400 if email is missing', async () => {
  const mockEvent = { request: { json: async () => ({}) } } as any;
  const response = await serverModule.POST(mockEvent);
  const data = JSON.parse(await response.text());

  expect(response.status).toBe(400);
  expect(data.error).toBe('Email required');
});

// Existing user
it('returns 409 if email already in use', async () => {
  (prisma.user.findUnique as any).mockResolvedValue({ id: 'user1', email: 'test@example.com' });

  const mockEvent = { request: { json: async () => ({ email: 'test@example.com' }) } } as any;
  const response = await serverModule.POST(mockEvent);
  const data = JSON.parse(await response.text());

  expect(response.status).toBe(409);
  expect(data.error).toBe('Email already in use');
});

// Successful sign-up
it('creates user, magic token, and sends email', async () => {
  (prisma.user.findUnique as any).mockResolvedValue(null);
  (randomBytes as any).mockReturnValue(Buffer.from('1234'));
  (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(prisma));
  (prisma.user.create as any).mockResolvedValue({ id: 'user1', email: 'test@example.com' });
  (prisma.magicToken.create as any).mockResolvedValue(true);
  (sendEmail as any).mockResolvedValue(true);

  process.env.VITE_BASE_URL = 'http://localhost';

  const mockEvent = {
    request: { json: async () => ({ email: 'test@example.com', firstName: 'John', lastName: 'Doe' }) }
  } as any;

  const response = await serverModule.POST(mockEvent);
  const data = JSON.parse(await response.text());

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(prisma.user.create).toHaveBeenCalled();
  expect(prisma.magicToken.create).toHaveBeenCalled();
  expect(sendEmail).toHaveBeenCalled();
});

// Email send failure triggers rollback
it('rolls back user and token if email send fails', async () => {
  (prisma.user.findUnique as any).mockResolvedValue(null);
  (randomBytes as any).mockReturnValue(Buffer.from('1234'));
  (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(prisma));
  (prisma.user.create as any).mockResolvedValue({ id: 'user1', email: 'test@example.com' });
  (prisma.magicToken.create as any).mockResolvedValue(true);
  (sendEmail as any).mockRejectedValue(new Error('Email failed'));

  const mockEvent = {
    request: { json: async () => ({ email: 'test@example.com', firstName: 'John', lastName: 'Doe' }) }
  } as any;

  const response = await serverModule.POST(mockEvent);
  const data = JSON.parse(await response.text());

  expect(response.status).toBe(500);
  expect(data.error).toBe('Failed to send confirmation email');
  expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user1' } });
  expect(prisma.magicToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user1' } });
});

// Database transaction failure
it('returns 500 if transaction fails', async () => {
  (prisma.user.findUnique as any).mockResolvedValue(null);
  (prisma.$transaction as any).mockRejectedValue(new Error('DB fail'));

  const mockEvent = {
    request: { json: async () => ({ email: 'test@example.com', firstName: 'John', lastName: 'Doe' }) }
  } as any;

  const response = await serverModule.POST(mockEvent);
  const data = JSON.parse(await response.text());

  expect(response.status).toBe(500);
  expect(data.error).toBe('Database error during signup');
});

