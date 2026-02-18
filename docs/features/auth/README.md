# Authentication System

Sigmagit uses [better-auth](https://better-auth.com) for a comprehensive authentication system with support for multiple authentication methods.

## Overview

The authentication system provides:

- Email/password authentication
- Passkey (WebAuthn) support
- Session-based authentication
- Social login (optional, via OAuth)
- Secure password reset
- Multi-factor authentication (future)

## Configuration

### Environment Variables

```env
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=https://api.yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# OR SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Database Schema

Authentication tables are defined in `packages/db/src/auth.ts`:

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'),
  name: text('name'),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Setup

### Initialize Auth

```typescript
// apps/api/src/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@sigmagit/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
});
```

### Configure Hono Middleware

```typescript
// apps/api/src/middleware/auth.ts
import { auth } from '../auth';
import type { AuthVariables } from '../types';

export async function requireAuth(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  const session = await auth.api.getSession({
    headers: c.req.header(),
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session);

  await next();
}

export async function requireVerifiedUser(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  await requireAuth(c, async () => {});

  const user = c.get('user')!;

  if (!user.verified) {
    return c.json({ error: 'Email not verified' }, 403);
  }

  await next();
}
```

## API Endpoints

### Registration

```typescript
app.post('/api/auth/register', async (c) => {
  const { email, password, username } = await c.req.json();

  const result = await auth.api.signUp({
    body: {
      email,
      password,
      username,
    },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ data: result.data });
});
```

### Login

```typescript
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  const result = await auth.api.signIn({
    body: {
      email,
      password,
    },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 401);
  }

  return c.json({ data: result.data });
});
```

### Logout

```typescript
app.post('/api/auth/logout', requireAuth, async (c) => {
  const session = c.get('session');

  await auth.api.signOut({
    headers: c.req.header(),
  });

  return c.json({ success: true });
});
```

### Get Current User

```typescript
app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user')!;

  return c.json({ data: user });
});
```

### Password Reset

```typescript
app.post('/api/auth/forgot-password', async (c) => {
  const { email } = await c.req.json();

  await auth.api.forgetPassword({
    body: { email },
  });

  return c.json({ success: true });
});

app.post('/api/auth/reset-password', async (c) => {
  const { token, password } = await c.req.json();

  const result = await auth.api.resetPassword({
    body: { token, password },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ success: true });
});
```

## Email Verification

### Send Verification Email

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const verificationUrl = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'Sigmagit <noreply@sigmagit.dev>',
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Sigmagit!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
```

### Verify Email

```typescript
app.get('/api/auth/verify-email', async (c) => {
  const { token } = c.req.query();

  const result = await auth.api.verifyEmail({
    query: { token },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ success: true });
});
```

## Passkey Authentication

### Register Passkey

```typescript
app.post('/api/auth/passkey/register', requireAuth, async (c) => {
  const user = c.get('user')!;

  const options = await auth.api.generatePasskeyRegistrationOptions({
    headers: c.req.header(),
  });

  return c.json({ data: options });
});

app.post('/api/auth/passkey/verify', async (c) => {
  const { response } = await c.req.json();

  const result = await auth.api.verifyPasskeyRegistration({
    body: { response },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ success: true });
});
```

### Login with Passkey

```typescript
app.post('/api/auth/passkey/login/options', async (c) => {
  const { username } = await c.req.json();

  const options = await auth.api.generatePasskeyAuthenticationOptions({
    body: { username },
  });

  return c.json({ data: options });
});

app.post('/api/auth/passkey/login/verify', async (c) => {
  const { response } = await c.req.json();

  const result = await auth.api.verifyPasskeyAuthentication({
    body: { response },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ data: result.data });
});
```

## Account Management

### Update Profile

```typescript
app.patch('/api/user/profile', requireAuth, async (c) => {
  const user = c.get('user')!;
  const { name, username, avatarUrl } = await c.req.json();

  const updated = await db
    .update(users)
    .set({
      name,
      username,
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning()
    .get();

  return c.json({ data: updated });
});
```

### Change Password

```typescript
app.post('/api/user/change-password', requireAuth, async (c) => {
  const user = c.get('user')!;
  const { currentPassword, newPassword } = await c.req.json();

  const result = await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
    },
  });

  if (result.error) {
    return c.json({ error: result.error.message }, 400);
  }

  return c.json({ success: true });
});
```

### Delete Account

```typescript
app.delete('/api/user/account', requireAuth, async (c) => {
  const user = c.get('user')!;

  await db.delete(users).where(eq(users.id, user.id));

  await auth.api.signOut({
    headers: c.req.header(),
  });

  return c.json({ success: true });
});
```

## Frontend Integration

### Auth Provider

```typescript
// packages/hooks/src/context.tsx
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, []);

  async function refreshUser() {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await api.login({ email, password });
    await refreshUser();
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Routes

```typescript
// apps/web/src/routes/_protected.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuth } from '@sigmagit/hooks';

export const Route = createFileRoute('/_protected')({
  beforeLoad: () => {
    const { user } = useAuth();

    if (!user) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <Outlet />;
}
```

## Security Best Practices

### Password Security

- Minimum 12 characters
- Require uppercase, lowercase, numbers, and special characters
- Hash passwords with bcrypt (cost factor 10+)
- Check against common password lists

```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain special character');
```

### Session Security

- Secure, httpOnly cookies
- SameSite: strict
- 30-day session expiration
- Session rotation on password change

### Rate Limiting

```typescript
app.use('/api/auth/*', rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
}));
```

## Troubleshooting

### Session Not Persisting

- Check cookie settings in browser
- Verify `BETTER_AUTH_URL` matches your domain
- Ensure HTTPS is enabled in production

### Email Verification Not Working

- Verify SMTP settings
- Check spam folder
- Confirm `RESEND_API_KEY` is valid
- Check email templates

### Passkey Issues

- Ensure browser supports WebAuthn
- Verify HTTPS is enabled (required for WebAuthn)
- Check device supports biometric authentication
