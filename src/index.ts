import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import attendanceRoutes from './routes/attendance.js';
import cardsRoutes from './routes/cards.js';
import studentsRoutes from './routes/students.js';
import pagesRoutes from './routes/pages.js';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'src', 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'upgrade-insecure-requests': null,
    },
  },
}));

app.use(cors({
  origin: env.corsOrigin,
}));

app.use(express.static(path.join(projectRoot, 'public')));

app.use(requestLogger);

app.use(express.json({ limit: '1kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'aman', db: 'tersambung', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});


app.use('/api/attendance', attendanceRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/students', studentsRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use(pagesRoutes);

app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

const SHUTDOWN_TIMEOUT = 10_000;

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error(`Forced exit after ${SHUTDOWN_TIMEOUT}ms timeout`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  forceExit.unref();

  server.close(() => {
    console.log('HTTP server closed.');
  });

  try {
    await pool.end();
    console.log('Database pool closed.');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }

  clearTimeout(forceExit);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
