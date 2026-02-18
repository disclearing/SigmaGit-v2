import { randomBytes } from 'crypto';

export interface LinkedAccount {
  discordId: string;
  sigmagitUserId: string;
  sigmagitUsername: string;
  sigmagitEmail: string;
  linkedAt: Date;
  lastVerifiedAt?: Date;
  verified: boolean;
}

export interface LinkToken {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export function generateLinkToken(): string {
  return randomBytes(32).toString('hex');
}

export function isValidLinkToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

export function calculateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}
