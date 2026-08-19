import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL
  ?? `mysql://${encodeURIComponent(process.env.DB_USER ?? 'root')}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? 3306}/${process.env.DB_NAME ?? 'rfid_attendance'}`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: { url },
});
