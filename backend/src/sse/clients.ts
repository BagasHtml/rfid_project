import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ClientConnection {
  id: string;
  res: Response;
  lastHeartbeat: number;
}

const clients = new Map<string, ClientConnection>();
const MAX_CLIENTS = 100;
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 90000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function startHeartbeat() {
  if (heartbeatTimer) return;

  heartbeatTimer = setInterval(() => {
    const now = Date.now();
    const deadClients: string[] = [];

    for (const [id, client] of clients) {
      if (now - client.lastHeartbeat > CONNECTION_TIMEOUT) {
        deadClients.push(id);
        continue;
      }

      try {
        client.res.write(': heartbeat\n\n');
        client.lastHeartbeat = now;
      } catch {
        deadClients.push(id);
      }
    }

    deadClients.forEach(id => {
      clients.delete(id);
    });
  }, HEARTBEAT_INTERVAL);

  heartbeatTimer.unref();
}

function stopHeartbeatIfEmpty() {
  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function registerClient(req: Request, res: Response): void {
  if (clients.size >= MAX_CLIENTS) {
    res.status(503).json({ success: false, message: 'Terlalu banyak koneksi' });
    return;
  }

  const id = randomUUID();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const client: ClientConnection = {
    id,
    res,
    lastHeartbeat: Date.now(),
  };

  clients.set(id, client);
  startHeartbeat();

  req.on('close', () => {
    clients.delete(id);
    stopHeartbeatIfEmpty();
  });

  req.on('error', () => {
    clients.delete(id);
    stopHeartbeatIfEmpty();
  });
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const deadClients: string[] = [];

  for (const [id, client] of clients) {
    try {
      client.res.write(payload);
      client.lastHeartbeat = Date.now();
    } catch {
      deadClients.push(id);
    }
  }

  deadClients.forEach(id => {
    clients.delete(id);
  });

  stopHeartbeatIfEmpty();
}

export function getClientCount(): number {
  return clients.size;
}
