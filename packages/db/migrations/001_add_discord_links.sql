-- Migration: Add Discord account linking support
-- Date: 2025-02-18
-- Description: Create tables for Discord account linking and verification tokens

-- Create discord_links table for storing linked Discord accounts
CREATE TABLE IF NOT EXISTS discord_links (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  sigmagit_user_id VARCHAR(255) NOT NULL,
  sigmagit_username VARCHAR(255) NOT NULL,
  sigmagit_email VARCHAR(255) NOT NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_verified_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE
);

-- Create index on discord_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_discord_links_discord_id ON discord_links(discord_id);

-- Create index on sigmagit_user_id for user lookups
CREATE INDEX IF NOT EXISTS idx_discord_links_sigmagit_user_id ON discord_links(sigmagit_user_id);

-- Create link_tokens table for verification tokens
CREATE TABLE IF NOT EXISTS link_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index on token for token lookups
CREATE INDEX IF NOT EXISTS idx_link_tokens_token ON link_tokens(token);

-- Create index on user_id for user lookups
CREATE INDEX IF NOT EXISTS idx_link_tokens_user_id ON link_tokens(user_id);

-- Create index on expires_at for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_link_tokens_expires_at ON link_tokens(expires_at);
