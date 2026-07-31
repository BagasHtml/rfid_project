import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
export async function get(key) {
    const rows = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);
    return rows[0]?.value ?? null;
}
