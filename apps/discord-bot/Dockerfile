FROM oven/bun:1.1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/discord-bot/package.json ./apps/discord-bot/

RUN bun install

COPY apps/discord-bot ./apps/discord-bot

FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/discord-bot ./apps/discord-bot

ENV NODE_ENV=production

WORKDIR /app/apps/discord-bot

CMD ["bun", "run", "src/index.ts"]
