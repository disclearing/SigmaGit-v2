import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

config({ path: '../../.env' });

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log('Applying Nostr fields migration...');

  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_public_key" text;
  `;
  console.log('✓ Added nostr_public_key column');

  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_linked_at" timestamp;
  `;
  console.log('✓ Added nostr_linked_at column');

  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nwc_connection_string" text;
  `;
  console.log('✓ Added nwc_connection_string column');

  // Add unique constraint if not exists
  const constraintExists = await sql`
    SELECT 1 FROM pg_constraint WHERE conname = 'users_nostr_public_key_unique'
  `;

  if (constraintExists.length === 0) {
    await sql`
      ALTER TABLE "users" ADD CONSTRAINT "users_nostr_public_key_unique" UNIQUE("nostr_public_key");
    `;
    console.log('✓ Added unique constraint on nostr_public_key');
  } else {
    console.log('✓ Unique constraint already exists');
  }

  console.log('\nNostr fields migration completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
