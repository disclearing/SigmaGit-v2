# Webhooks

Sigmagit supports webhooks for repository events, allowing integrations with external services like Discord, Slack, and custom tools.

## Overview

The webhook system provides:

- Repository event notifications (issues, PRs, commits, etc.)
- Secure webhook delivery with signature verification
- Retry logic for failed deliveries
- Webhook management API
- Support for custom payloads

## Database Schema

```typescript
// packages/db/src/webhooks.ts
export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: text('events').notNull().array(),
  active: boolean('active').notNull().default(true),
  lastDeliveryAt: timestamp('last_delivery_at'),
  lastDeliveryStatus: text('last_delivery_status'),
  failureCount: integer('failure_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookId: uuid('webhook_id').references(() => webhooks.id).notNull(),
  eventType: text('event_type').notNull(),
  payload: json('payload').notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  deliveredAt: timestamp('delivered_at').defaultNow(),
});
```

## Event Types

Sigmagit supports the following webhook events:

- `issues.opened` - New issue created
- `issues.closed` - Issue closed
- `issues.reopened` - Issue reopened
- `issues.edited` - Issue edited
- `issues.deleted` - Issue deleted

- `pull_request.opened` - New PR created
- `pull_request.closed` - PR closed
- `pull_request.merged` - PR merged
- `pull_request.reopened` - PR reopened
- `pull_request.edited` - PR edited

- `push` - Code pushed to repository
- `commit` - Individual commit

- `star.added` - Repository starred
- `star.removed` - Repository unstarred

- `fork.created` - Repository forked

## Webhook Management

### Create Webhook

```typescript
// apps/api/src/routes/webhooks.ts
app.post('/api/repositories/:owner/:repo/webhooks', requireAuth, async (c) => {
  const { owner, repo } = c.req.param();
  const user = c.get('user')!;

  const { url, events } = await c.req.json();

  // Get repository
  const repository = await getRepository(owner, repo);

  if (!repository || repository.ownerId !== user.id) {
    return c.json({ error: 'Repository not found or unauthorized' }, 404);
  }

  // Generate secret
  const secret = crypto.randomBytes(32).toString('hex');

  // Create webhook
  const webhook = await db.insert(webhooks).values({
    repositoryId: repository.id,
    url,
    secret,
    events: events || ['issues.opened', 'pull_request.opened', 'push'],
  }).returning().get();

  return c.json({
    data: {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret, // Only show once
    },
  });
});
```

### List Webhooks

```typescript
app.get('/api/repositories/:owner/:repo/webhooks', requireAuth, async (c) => {
  const { owner, repo } = c.req.param();
  const user = c.get('user')!;

  const repository = await getRepository(owner, repo);

  if (!repository || repository.ownerId !== user.id) {
    return c.json({ error: 'Repository not found or unauthorized' }, 404);
  }

  const hooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.repositoryId, repository.id));

  // Don't expose secrets in list
  const safeHooks = hooks.map(h => ({
    ...h,
    secret: undefined,
  }));

  return c.json({ data: safeHooks });
});
```

### Update Webhook

```typescript
app.patch('/api/webhooks/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const user = c.get('user')!;
  const { url, events, active } = await c.req.json();

  const webhook = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, id))
    .get();

  if (!webhook) {
    return c.json({ error: 'Webhook not found' }, 404);
  }

  // Verify ownership
  const repository = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, webhook.repositoryId))
    .get();

  if (!repository || repository.ownerId !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const updated = await db
    .update(webhooks)
    .set({
      url: url ?? webhook.url,
      events: events ?? webhook.events,
      active: active ?? webhook.active,
      updatedAt: new Date(),
    })
    .where(eq(webhooks.id, id))
    .returning()
    .get();

  return c.json({ data: updated });
});
```

### Delete Webhook

```typescript
app.delete('/api/webhooks/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const user = c.get('user')!;

  const webhook = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, id))
    .get();

  if (!webhook) {
    return c.json({ error: 'Webhook not found' }, 404);
  }

  // Verify ownership
  const repository = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, webhook.repositoryId))
    .get();

  if (!repository || repository.ownerId !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  await db.delete(webhooks).where(eq(webhooks.id, id));

  return c.json({ success: true });
});
```

## Webhook Delivery

### Triggering Webhooks

```typescript
export async function triggerWebhooks(
  repositoryId: string,
  eventType: string,
  payload: any
): Promise<void> {
  const hooks = await db
    .select()
    .from(webhooks)
    .where(
      and(
        eq(webhooks.repositoryId, repositoryId),
        eq(webhooks.active, true),
        arrayContains(webhooks.events, eventType)
      )
    );

  await Promise.all(
    hooks.map(hook => deliverWebhook(hook, eventType, payload))
  );
}
```

### Delivering Webhooks

```typescript
async function deliverWebhook(
  webhook: Webhook,
  eventType: string,
  payload: any
): Promise<void> {
  const signature = createSignature(payload, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sigmagit-Event': eventType,
        'X-Sigmagit-Signature': signature,
        'User-Agent': 'Sigmagit-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    // Log delivery
    await db.insert(webhookDeliveries).values({
      webhookId: webhook.id,
      eventType,
      payload,
      statusCode: response.status,
      response: await response.text(),
    });

    // Update webhook status
    if (response.ok) {
      await db
        .update(webhooks)
        .set({
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: 'success',
          failureCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, webhook.id));
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // Log failure
    await db.insert(webhookDeliveries).values({
      webhookId: webhook.id,
      eventType,
      payload,
      response: error.message,
    });

    // Update webhook with failure
    await db
      .update(webhooks)
      .set({
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: 'failed',
        failureCount: sql`${webhooks.failureCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, webhook.id));

    // Disable after too many failures
    if (webhook.failureCount >= 10) {
      await db
        .update(webhooks)
        .set({ active: false })
        .where(eq(webhooks.id, webhook.id));
    }
  }
}
```

### Signature Creation

```typescript
import crypto from 'crypto';

export function createSignature(payload: any, secret: string): string {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}
```

### Signature Verification

```typescript
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createSignature(payload, secret);

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
```

## Event Payloads

### Issue Event

```typescript
interface IssueEvent {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'deleted';
  repository: {
    id: string;
    owner: string;
    name: string;
    url: string;
  };
  issue: {
    id: string;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    author: {
      id: string;
      username: string;
      name: string;
    };
    labels: Label[];
    assignees: Assignee[];
    url: string;
    createdAt: string;
    updatedAt: string;
  };
  sender: {
    id: string;
    username: string;
  };
}
```

### Pull Request Event

```typescript
interface PullRequestEvent {
  action: 'opened' | 'closed' | 'merged' | 'reopened' | 'edited';
  repository: {
    id: string;
    owner: string;
    name: string;
    url: string;
  };
  pullRequest: {
    id: string;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed' | 'merged';
    author: {
      id: string;
      username: string;
      name: string;
    };
    baseRepo: { id: string; name: string };
    headRepo: { id: string; name: string };
    baseBranch: string;
    headBranch: string;
    url: string;
    createdAt: string;
    updatedAt: string;
  };
  sender: {
    id: string;
    username: string;
  };
}
```

### Push Event

```typescript
interface PushEvent {
  repository: {
    id: string;
    owner: string;
    name: string;
    url: string;
  };
  pusher: {
    id: string;
    username: string;
  };
  ref: string;
  before: string;
  after: string;
  commits: {
    oid: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: number;
  }[];
  totalCommits: number;
  sender: {
    id: string;
    username: string;
  };
}
```

## Retry Logic

Webhooks are automatically retried on failure:

- First retry: 1 minute delay
- Second retry: 5 minutes delay
- Third retry: 30 minutes delay
- Fourth retry: 2 hours delay
- Fifth retry: 6 hours delay

After 5 failures, the webhook is disabled.

```typescript
async function retryWebhook(webhookId: string): Promise<void> {
  const webhook = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .get();

  if (!webhook || webhook.failureCount === 0) {
    return;
  }

  const delays = [1, 5, 30, 120, 360]; // minutes

  if (webhook.failureCount <= delays.length) {
    const delay = delays[webhook.failureCount - 1];

    setTimeout(async () => {
      const lastDelivery = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.webhookId, webhookId))
        .orderBy(desc(webhookDeliveries.deliveredAt))
        .limit(1)
        .get();

      if (lastDelivery) {
        await deliverWebhook(webhook, lastDelivery.eventType, lastDelivery.payload);
      }
    }, delay * 60 * 1000);
  }
}
```

## Integration Examples

### Discord Bot Integration

```typescript
// apps/discord-bot/src/webhooks.ts
export async function sendNotificationToChannel(
  channelId: string,
  embed: EmbedBuilder
) {
  const channel = await client.channels.fetch(channelId);

  if (channel && 'send' in channel) {
    await (channel as TextChannel).send({ embeds: [embed] });
  }
}

export function createIssueEmbed(event: IssueEvent): EmbedBuilder {
  const { action, repository, issue } = event;

  return new EmbedBuilder()
    .setTitle(`${getActionEmoji(action)} Issue #${issue.number}`)
    .setDescription(issue.title)
    .setURL(issue.url)
    .addFields(
      { name: 'State', value: issue.state, inline: true },
      { name: 'Author', value: issue.author.username, inline: true },
    )
    .setColor(getColorForAction(action))
    .setTimestamp(new Date(issue.createdAt));
}
```

### Slack Integration

```typescript
async function sendToSlack(webhook: string, payload: any) {
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${payload.repository.owner}/${payload.repository.name}: ${payload.action}`,
      attachments: [{
        title: payload.issue?.title || payload.pullRequest?.title,
        text: payload.issue?.body || payload.pullRequest?.body,
        color: getSlackColor(payload.action),
      }],
    }),
  });
}
```

### Custom Integration

```typescript
// Webhook receiver server
import { verifySignature } from '@sigmagit/lib';

app.post('/webhooks/sigmagit', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('x-sigmagit-signature');

  const secret = process.env.SIGMAGIT_WEBHOOK_SECRET;

  if (!verifySignature(payload, signature, secret)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const event = JSON.parse(payload);

  switch (c.req.header('x-sigmagit-event')) {
    case 'issues.opened':
      await handleNewIssue(event);
      break;
    case 'pull_request.merged':
      await handleMergedPR(event);
      break;
    case 'push':
      await handlePush(event);
      break;
  }

  return c.json({ received: true });
});
```

## Security

### Signature Verification

Always verify webhook signatures:

```typescript
app.post('/webhooks', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('x-sigmagit-signature');

  if (!verifySignature(payload, signature, webhook.secret)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Process webhook...
});
```

### IP Whitelisting (Optional)

Restrict webhook delivery to specific IP ranges:

```typescript
const ALLOWED_IPS = ['192.168.1.0/24', '10.0.0.0/8'];

function isAllowedIP(ip: string): boolean {
  return ALLOWED_IPS.some(range => ipInRange(ip, range));
}

app.post('/webhooks', async (c) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

  if (!isAllowedIP(ip)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Process webhook...
});
```

## Monitoring

### Webhook Status Monitoring

Monitor webhook delivery status:

```typescript
app.get('/api/webhooks/:id/deliveries', requireAuth, async (c) => {
  const { id } = c.req.param();

  const deliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, id))
    .orderBy(desc(webhookDeliveries.deliveredAt))
    .limit(100);

  return c.json({ data: deliveries });
});
```

### Success Rate Monitoring

Calculate webhook success rate:

```typescript
async function getWebhookStats(webhookId: string) {
  const stats = await db
    .select({
      total: count(),
      success: count(sql`CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END`),
      failed: count(sql`CASE WHEN status_code >= 400 THEN 1 END`),
    })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhookId))
    .get();

  return {
    ...stats,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
  };
}
```

## Troubleshooting

### Webhook Not Triggered

- Verify webhook is active
- Check event types are enabled
- Confirm repository matches
- Check logs for errors

### Signature Verification Failed

- Verify secret matches
- Check signature header format
- Ensure payload is stringified correctly
- Check for encoding issues

### Delivery Failed

- Check URL is accessible
- Verify server responds quickly (< 30s)
- Check response code (expect 2xx)
- Review webhook logs

### Webhook Disabled

- Check failure count
- Review delivery history
- Fix underlying issue
- Re-enable webhook
