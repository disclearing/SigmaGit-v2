import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from "dotenv";
import { resolve } from "path";

if (!process.env.DATABASE_URL) {
  const cwd = process.cwd();
  const possiblePaths = [resolve(cwd, ".env"), resolve(cwd, "../.env"), resolve(cwd, "../../.env")];

  for (const envPath of possiblePaths) {
    const result = config({ path: envPath });
    if (result.parsed?.DATABASE_URL || process.env.DATABASE_URL) {
      break;
    }
  }
}

export * from "./schema";
export { schema };

export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, {
    max: 50,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
  return drizzle(client, { schema });
}

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 50,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
});
export const db = drizzle(client, { schema });

export type Database = ReturnType<typeof createDatabase>;
