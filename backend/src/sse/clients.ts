import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const clients = new Map<string, Response>();

const MAX_CLIENTS = 20;

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

  clients.set(id, res);

  req.on('close', () => {
    clients.delete(id);
  });
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const [id, res] of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(id);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}