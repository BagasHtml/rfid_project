import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function envString(key: string, devDefault: string) {
  if (isProduction) {
    return z.string().min(1, {
      message: `[ENV ERROR] Missing required variable: ${key}. Set it in .env or environment.`,
    });
  }
  return z.string().min(1).default(devDefault);
}

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: envString('CORS_ORIGIN', 'http://localhost:4321'),
  DB_HOST: envString('DB_HOST', 'localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: envString('DB_USER', 'root'),
  DB_PASSWORD: isProduction
    ? z.string().min(1, {
        message: '[ENV ERROR] Missing required variable: DB_PASSWORD. Set it in .env or environment.',
      })
    : z.string().optional().default(''),
  DB_NAME: envString('DB_NAME', 'rfid_attendance'),
  LATE_THRESHOLD: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'LATE_THRESHOLD harus format HH:MM:SS')
    .default('07:00:00'),
  APP_TIMEZONE: z
    .string()
    .trim()
    .optional()
    .transform(v => (v ? v : 'Asia/Jakarta')),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
  SESSION_SECRET: envString('SESSION_SECRET', 'dev-session-secret-change-in-production'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues
    .map(issue => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`[ENV ERROR] Konfigurasi lingkungan tidak valid:\n${messages}`);
}

if (!isProduction && parsed.data.DB_PASSWORD === '') {
  console.warn('[ENV WARN] DB_PASSWORD tidak diatur. Pastikan ini disengaja (MySQL tanpa password).');
}

try {
  new Intl.DateTimeFormat('en-GB', { timeZone: parsed.data.APP_TIMEZONE });
} catch {
  throw new Error(
    `[ENV ERROR] APP_TIMEZONE tidak valid: "${parsed.data.APP_TIMEZONE}". Gunakan nama zona IANA (mis. Asia/Jakarta).`
  );
}

export const env = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  corsOrigin: parsed.data.CORS_ORIGIN,
  db: {
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
    name: parsed.data.DB_NAME,
  },
  lateThreshold: parsed.data.LATE_THRESHOLD,
  timezone: parsed.data.APP_TIMEZONE,
  trustProxy: parsed.data.TRUST_PROXY,
  sessionSecret: parsed.data.SESSION_SECRET,
} as const;
