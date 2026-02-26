FROM oven/bun:1.1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/docs/package.json ./apps/docs/

RUN bun install

COPY apps/docs ./apps/docs

WORKDIR /app/apps/docs
RUN bun run build

FROM oven/bun:1.1-alpine AS runner

WORKDIR /app/apps/docs

COPY --from=builder /app/apps/docs/.next ./.next
COPY --from=builder /app/apps/docs/node_modules ./node_modules
COPY --from=builder /app/apps/docs/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3002

CMD ["bun", "run", "start"]
