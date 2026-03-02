import { db, users } from './src';
import { and, inArray, ne, or } from 'drizzle-orm';

type Role = 'user' | 'admin' | 'moderator';

interface ParsedArgs {
  command: 'list' | 'promote' | 'help';
  ids: string[];
  emails: string[];
  usernames: string[];
  all: boolean;
}

function parseCsvArg(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): ParsedArgs {
  const [rawCommand, ...flags] = argv;
  const command: ParsedArgs['command'] =
    rawCommand === 'list' || rawCommand === 'promote' ? rawCommand : 'help';

  const args: ParsedArgs = {
    command,
    ids: [],
    emails: [],
    usernames: [],
    all: false,
  };

  for (let i = 0; i < flags.length; i += 1) {
    const flag = flags[i];
    const next = flags[i + 1];

    if (flag === '--all') {
      args.all = true;
      continue;
    }

    if (flag === '--id' && next) {
      args.ids.push(...parseCsvArg(next));
      i += 1;
      continue;
    }

    if (flag === '--email' && next) {
      args.emails.push(...parseCsvArg(next));
      i += 1;
      continue;
    }

    if (flag === '--username' && next) {
      args.usernames.push(...parseCsvArg(next));
      i += 1;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
User management helper

Usage:
  bun run users:list
  bun run users:admin -- --email user@example.com
  bun run users:admin -- --username alice,bob
  bun run users:admin -- --id user_123,user_456
  bun run users:admin -- --all

Options:
  --email <csv>      Promote users by email
  --username <csv>   Promote users by username
  --id <csv>         Promote users by id
  --all              Promote all non-admin users
`.trim());
}

function printUsers(rows: Array<{ id: string; username: string; email: string; role: Role }>) {
  if (rows.length === 0) {
    console.log('No users found.');
    return;
  }

  const idWidth = Math.max('ID'.length, ...rows.map((row) => row.id.length));
  const usernameWidth = Math.max('USERNAME'.length, ...rows.map((row) => row.username.length));
  const emailWidth = Math.max('EMAIL'.length, ...rows.map((row) => row.email.length));
  const roleWidth = Math.max('ROLE'.length, ...rows.map((row) => row.role.length));

  const header = [
    'ID'.padEnd(idWidth),
    'USERNAME'.padEnd(usernameWidth),
    'EMAIL'.padEnd(emailWidth),
    'ROLE'.padEnd(roleWidth),
  ].join('  ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const row of rows) {
    console.log(
      [
        row.id.padEnd(idWidth),
        row.username.padEnd(usernameWidth),
        row.email.padEnd(emailWidth),
        row.role.padEnd(roleWidth),
      ].join('  ')
    );
  }
}

async function listUsers() {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .orderBy(users.createdAt);

  printUsers(result as Array<{ id: string; username: string; email: string; role: Role }>);
}

async function promoteToAdmin(args: ParsedArgs) {
  const selectors = [];
  if (args.ids.length) selectors.push(inArray(users.id, args.ids));
  if (args.emails.length) selectors.push(inArray(users.email, args.emails));
  if (args.usernames.length) selectors.push(inArray(users.username, args.usernames));

  if (!args.all && selectors.length === 0) {
    console.error('No target users provided. Use --all, --id, --email, or --username.');
    process.exitCode = 1;
    return;
  }

  const selectedUsersClause =
    selectors.length === 1 ? selectors[0] : selectors.length > 1 ? or(...selectors) : undefined;

  const whereClause = args.all
    ? ne(users.role, 'admin')
    : and(selectedUsersClause!, ne(users.role, 'admin'));

  const result = await db
    .update(users)
    .set({
      role: 'admin',
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    });

  if (result.length === 0) {
    console.log('No users were updated.');
    return;
  }

  console.log(`Updated ${result.length} user(s) to admin:`);
  printUsers(result as Array<{ id: string; username: string; email: string; role: Role }>);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === 'help') {
    printHelp();
    return;
  }

  if (args.command === 'list') {
    await listUsers();
    return;
  }

  if (args.command === 'promote') {
    await promoteToAdmin(args);
  }
}

main().catch((error: unknown) => {
  console.error('Failed to run manage-users script.');
  console.error(error);
  process.exitCode = 1;
});
