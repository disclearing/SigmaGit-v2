import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const discordLinks = pgTable('discord_links', {
  id: serial('id').primaryKey(),
  discordId: varchar('discord_id', { length: 255 }).notNull().unique(),
  sigmagitUserId: varchar('sigmagit_user_id', { length: 255 }).notNull(),
  sigmagitUsername: varchar('sigmagit_username', { length: 255 }).notNull(),
  sigmagitEmail: varchar('sigmagit_email', { length: 255 }).notNull(),
  linkedAt: timestamp('linked_at').defaultNow(),
  lastVerifiedAt: timestamp('last_verified_at'),
  verified: boolean('verified').default(false).notNull(),
});

export const linkTokens = pgTable('link_tokens', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  used: boolean('used').default(false).notNull(),
});

export type DiscordLink = typeof discordLinks.$inferSelect;
export type NewDiscordLink = typeof discordLinks.$inferInsert;
export type LinkToken = typeof linkTokens.$inferSelect;
export type NewLinkToken = typeof linkTokens.$inferInsert;
