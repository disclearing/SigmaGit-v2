-- Apply Nostr fields to existing users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_public_key" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_linked_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nwc_connection_string" text;

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_nostr_public_key_unique'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_nostr_public_key_unique" UNIQUE("nostr_public_key");
    END IF;
END $$;
