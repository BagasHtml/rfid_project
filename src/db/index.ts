import { drizzle } from 'drizzle-orm/mysql2';
import { pool } from '../config/db.js';
import * as schema from './schema.js';

export const db = drizzle(pool, { schema, mode: 'default' });
