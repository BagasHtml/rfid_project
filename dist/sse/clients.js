import { randomUUID } from 'crypto';
const clients = new Map();
const MAX_CLIENTS = 100;
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 90000;
let heartbeatTimer = null;
function startHeartbeat() {
    if (heartbeatTimer)
        return;
    heartbeatTimer = setInterval(() => {
        const now = Date.now();
        const deadClients = [];
        for (const [id, client] of clients) {
            if (now - client.lastHeartbeat > CONNECTION_TIMEOUT || client.res.writableEnded) {
                deadClients.push(id);
                continue;
            }
            try {
                client.res.write(': heartbeat\n\n');
                client.lastHeartbeat = now;
            }
            catch {
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
export function registerClient(req, res) {
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
    const client = {
        id,
        res,
        lastHeartbeat: Date.now(),
    };
    clients.set(id, client);
    startHeartbeat();
    const removeClient = () => {
        clients.delete(id);
        stopHeartbeatIfEmpty();
    };
    req.on('close', removeClient);
    req.on('error', removeClient);
    res.on('close', removeClient);
}
export function broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const deadClients = [];
    for (const [id, client] of clients) {
        if (client.res.writableEnded) {
            deadClients.push(id);
            continue;
        }
        try {
            client.res.write(payload);
            client.lastHeartbeat = Date.now();
        }
        catch {
            deadClients.push(id);
        }
    }
    deadClients.forEach(id => {
        clients.delete(id);
    });
    stopHeartbeatIfEmpty();
}
