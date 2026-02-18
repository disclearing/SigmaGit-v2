import type { ServerWebSocket } from "bun";
import { getAuth } from "./auth";

type WebSocketData = {
  userId: string;
  sessionId: string;
  timestamp: number;
  lastPing: number;
};

const wsConnections = new Map<string, Set<ServerWebSocket<WebSocketData>>>();
const CONNECTION_TIMEOUT = 30 * 60 * 1000;
const PING_INTERVAL = 5 * 60 * 1000;

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupStaleConnections();
  }, PING_INTERVAL);
}

function cleanupStaleConnections() {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, connections] of wsConnections.entries()) {
    for (const ws of connections) {
      if (now - ws.data.lastPing > CONNECTION_TIMEOUT) {
        console.log(`[WS] Closing stale connection for user ${userId}`);
        try {
          ws.close();
        } catch (err) {
          console.error("[WS] Error closing stale connection:", err);
        }
        connections.delete(ws);
        cleaned++;
      }
    }

    if (connections.size === 0) {
      wsConnections.delete(userId);
    }
  }

  if (cleaned > 0) {
    console.log(`[WS] Cleaned up ${cleaned} stale connections`);
  }
}

startCleanupInterval();

export function registerConnection(userId: string, ws: ServerWebSocket<WebSocketData>) {
  if (!wsConnections.has(userId)) {
    wsConnections.set(userId, new Set());
  }
  wsConnections.get(userId)!.add(ws);
}

export function unregisterConnection(userId: string, ws: ServerWebSocket<WebSocketData>) {
  const connections = wsConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      wsConnections.delete(userId);
    }
  }
}

export function notifyUser(userId: string, message: object) {
  const connections = wsConnections.get(userId);
  if (connections) {
    const payload = JSON.stringify(message);
    for (const ws of connections) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error("[WS] Failed to send message:", err);
        connections.delete(ws);
      }
    }
  }
}

export function notifyUsers(userIds: string[], message: object) {
  for (const userId of userIds) {
    notifyUser(userId, message);
  }
}

export function getConnectedUserCount(): number {
  return wsConnections.size;
}

export function isUserConnected(userId: string): boolean {
  return wsConnections.has(userId) && wsConnections.get(userId)!.size > 0;
}

export async function handleWebSocketUpgrade(
  request: Request,
  server: any
): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname !== "/ws") {
    return undefined;
  }

  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: new Headers({ Authorization: `Bearer ${token}` }),
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const upgraded = server.upgrade(request, {
      data: {
        userId: session.user.id,
        sessionId: session.session.id,
        timestamp: Date.now(),
        lastPing: Date.now(),
      },
    });

    if (upgraded) {
      return undefined;
    }

    return new Response("WebSocket upgrade failed", { status: 500 });
  } catch (err) {
    console.error("[WS] Auth error:", err);
    return new Response("Unauthorized", { status: 401 });
  }
}

export const websocketHandlers = {
  open(ws: ServerWebSocket<WebSocketData>) {
    const { userId } = ws.data;
    ws.data.lastPing = Date.now();
    registerConnection(userId, ws);

    ws.send(JSON.stringify({ type: "connected", userId }));
  },

  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "ping") {
        ws.data.lastPing = Date.now();
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch (err) {
      console.error("[WS] Invalid message:", err);
    }
  },

  close(ws: ServerWebSocket<WebSocketData>) {
    const { userId } = ws.data;
    unregisterConnection(userId, ws);
  },

  error(ws: ServerWebSocket<WebSocketData>, error: Error) {
    console.error("[WS] Error:", error);
    const { userId } = ws.data;
    unregisterConnection(userId, ws);
  },
};
