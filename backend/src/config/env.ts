import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    if (isProduction) {
      throw new Error(`[ENV ERROR] Missing required variable: ${key}. Set it in .env or environment.`);
    }
    console.warn(`[ENV WARN] ${key} not set, using default.`);
  }
  return value ?? '';
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: requireEnv('CORS_ORIGIN', 'http://localhost:4321'),
  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT) || 3306,
    user: requireEnv('DB_USER', 'root'),
    password: requireEnv('DB_PASSWORD', ''),
    name: requireEnv('DB_NAME', 'rfid_attendance'),
  },
  lateThreshold: process.env.LATE_THRESHOLD || '07:00:00',
} as const;