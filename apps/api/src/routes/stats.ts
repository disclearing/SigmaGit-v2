import { Hono } from "hono";

// Platform stats are served from health.ts (public, no auth). This file is for future stats routes.
const app = new Hono();

export default app;
