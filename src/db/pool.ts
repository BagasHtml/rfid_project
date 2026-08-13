import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 500,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
