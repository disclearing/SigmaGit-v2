import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { config, getAllowedOrigins } from "./config";
import { initAuth } from "./auth";
import { mountRoutes } from "./routes";
import { handleWebSocketUpgrade, websocketHandlers } from "./websocket";
import { memoryMiddleware, requestSizeMiddleware, gitLimitsMiddleware } from "./middleware/limits";
import { startMigrationWorker } from "./workers/migration";
import { startRunnerHealthWorker } from "./workers/runner-health";
import "./monitoring";

const app = new Hono();

const loggingMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const url = new URL(c.req.url);
  const query = url.search;

  await next();

  const status = c.res.status;
  const duration = Date.now() - start;
  const contentLength = c.res.headers.get("content-length") || "-";

  const skipLogging = path === "/health" || path === "/api/health";
  if (!skipLogging) {
    const statusColor =
      status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : status >= 300 ? "\x1b[36m" : "\x1b[32m";
    const resetColor = "\x1b[0m";

  }
});

app.use("*", loggingMiddleware);

// CORS headers for all actual (non-OPTIONS) responses
app.use("*", createMiddleware(async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin && allowedOrigins.includes(origin);
  const responseOrigin = isAllowed ? origin : (allowedOrigins[0] || "");

  c.header("Access-Control-Allow-Origin", responseOrigin);
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Vary", "Origin");

  await next();
}));

app.use("*", createMiddleware(async (c, next) => {
  await initAuth();
  await next();
}));

app.use("*", memoryMiddleware);
app.use("*", requestSizeMiddleware);
app.use("*", gitLimitsMiddleware);

mountRoutes(app);

// Start migration worker
if (config.enableMigrations) {
  startMigrationWorker();
}

// Start runner health worker (always enabled)
startRunnerHealthWorker();

const port = config.port;

export default {
  port,
  fetch: async (request: Request, server: any) => {
    // Handle ALL OPTIONS preflight requests at the Bun level — completely outside Hono.
    // This is the only reliable way to guarantee a clean CORS preflight response with no
    // interference from auth middleware, memory limits, or sub-router middleware.
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("origin");
      const allowedOrigins = getAllowedOrigins();
      const isAllowed = origin && allowedOrigins.includes(origin);
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isAllowed ? origin : (allowedOrigins[0] ?? ""),
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, x-internal-auth",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "300",
        },
      });
    }

    const wsResponse = await handleWebSocketUpgrade(request, server);
    if (wsResponse !== undefined) {
      return wsResponse;
    }

    return app.fetch(request);
  },
  websocket: websocketHandlers,
  idleTimeout: 255,
};
