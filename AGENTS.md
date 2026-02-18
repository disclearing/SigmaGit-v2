# AGENTS.md

This file contains guidelines for agentic coding assistants working in this repository.

## Development Commands

**Package Manager:** Bun 1.3.5+

### Common Commands
- `bun install` - Install dependencies
- `bun run dev:web` - Start web app + API server (ports 3000, 3001)
- `bun run dev:mobile` - Start mobile app + API server (ports 8081, 3001)
- `bun run build` - Build all applications (turbo)
- `bun run lint` - Lint all packages
- `turbo lint` - Lint all packages via turbo
- `turbo build` - Build all packages via turbo

### Testing
- `cd apps/web && bun run test` - Run all tests (Vitest)
- `cd apps/web && bunx vitest run <pattern>` - Run tests matching pattern
- `cd apps/web && bunx vitest watch` - Watch mode for development

### Database
- `bun run db:push` - Push schema changes to database
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Apply migrations
- `bun run db:studio` - Open Drizzle Studio

### Package-specific Commands
- `cd apps/web && bun run lint` - Lint web app
- `cd apps/api && bun run dev` - Start API server
- `cd apps/mobile && bun run dev` - Start Expo mobile app

## Code Style Guidelines

### Formatting
- Use Prettier (configured with `bunx prettier --write .`)
- Line width: 100 characters
- Indentation: 2 spaces (no tabs)
- Semicolons: required
- Quotes: single quotes
- Imports are auto-sorted via `prettier-plugin-sort-imports`
- Tailwind classes are sorted via `prettier-plugin-tailwindcss`

### TypeScript
- Strict mode enabled in tsconfig.json
- Type inference preferred where clear
- Use `interface` for object shapes, `type` for unions/primitives
- Export types with `export type` where appropriate
- Avoid `any`; use `unknown` or proper types

### Import Style
Imports are automatically sorted and grouped:
1. External libraries (React, TanStack, etc.)
2. Workspace packages (@sigmagit/*)
3. Relative imports using `@/` alias (for web)
4. Type imports grouped together

```typescript
// External libraries
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Workspace packages
import { timeAgo } from "@sigmagit/lib";
import { useRepositoryInfo } from "@sigmagit/hooks";

// Local modules
import { Button } from "@/components/ui/button";
import type { Repository } from "@/types";
```

### Naming Conventions
- Components: PascalCase (e.g., `RepositoryCard`)
- Functions/variables: camelCase (e.g., `getRepositoryInfo`)
- Types/interfaces: PascalCase (e.g., `Repository`, `UserPreferences`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Files: kebab-case for components/utilities (e.g., `repo-card.tsx`)

### Component Patterns
- Functional components with TypeScript props interfaces
- Extract props to interface at top of file
- Use `cn()` utility for conditional className merging
- Destructure props in function signature
- Keep components focused and composable

```typescript
interface RepoItemProps {
  repo: Repository;
  username: string;
  showOwner?: boolean;
}

export function RepoItem({ repo, username, showOwner = true }: RepoItemProps) {
  return <div className="flex items-center gap-2">...</div>;
}
```

### API Routes (Hono)
- Use typed route handlers with `Hono<{ Variables: AuthVariables }>`
- Apply middleware at route level with `app.use("*", middleware)`
- Return proper HTTP status codes with JSON responses
- Use `c.req.param()`, `c.req.json()`, `c.req.query()` for input
- Validate inputs before processing
- Return error objects: `{ error: "message" }`

```typescript
app.get("/api/repositories/:id", requireAuth, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  return c.json({ data: result });
});
```

### React Query Hooks
- Place in `packages/hooks/src` following feature domain
- Use `useApi()` context for API calls
- Query keys follow pattern: `["resource", "id", "action"]`
- Enable queries conditionally with `enabled`
- Mutations invalidate related queries on success
- Use `queryClient.invalidateQueries()` for cache updates

### Database (Drizzle ORM)
- Schema defined in `packages/db/src/schema.ts`
- Use `pgTable` for table definitions
- Export both tables and relations
- Type columns properly with `.$type<>()` for complex types
- Use indexes for frequently queried fields
- Cascade deletions appropriately

### Error Handling
- Use try-catch in async functions
- Log errors with context for debugging
- Return user-friendly error messages
- Handle null/undefined explicitly with optional chaining
- Validate inputs before processing

### Tailwind CSS
- Use utility classes exclusively
- Prefer semantic colors (primary, secondary, muted, etc.)
- Use `size-*` for width/height
- Use `gap-*` for spacing
- Responsive prefixes: `md:`, `lg:`
- Use `@/lib/utils` `cn()` for conditional classes

### File Organization
- Components grouped by feature/domain
- Shared UI components in `components/ui/`
- Hooks in `packages/hooks/src/`
- Utilities in `packages/lib/src/`
- Types inline with usage or in separate types files
- Keep related files in same directory

## Architecture Notes

- Monorepo managed by Turbo
- Web app uses TanStack Start with file-based routing
- API uses Hono with Bun runtime
- Git operations via isomorphic-git with S3 storage
- Auth via better-auth (email/password + passkeys)
- Real-time updates via Redis + WebSocket (optional)
