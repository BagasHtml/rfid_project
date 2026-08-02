import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';

const TTL_MS = 60_000;
const cache = new Map<string, { value: string; expiresAt: number }>();

export async function get(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (cached) cache.delete(key);

  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  const value = rows[0]?.value ?? null;
  if (value !== null) {
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }
  return value;
}
