#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { config as loadDotEnv } from 'dotenv';
import mysql from 'mysql2/promise';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv({ path: resolve(projectRoot, '.env') });

const DEFAULT_PASSWORD = 'ganti123';
const ADMIN_USERNAME = 'admin';

const CLASS_ACCOUNTS = [
  ['xii.rpl.1', 'XII RPL 1'],
  ['xii.rpl.2', 'XII RPL 2'],
  ['xii.rpl.3', 'XII RPL 3'],
  ['xii.rpl.4', 'XII RPL 4'],
  ['xii.rpl.5', 'XII RPL 5'],
];

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function printHelp() {
  console.log(`
Seed akun sistem absensi RFID.

Pemakaian:
  node scripts/seed-users.mjs [opsi]

Opsi:
  --create          Buat tabel users jika belum ada, lalu seed akun default
                    (admin + kelas xii.rpl.1..5).
  --reset-password <username>   Reset password akun menjadi ${DEFAULT_PASSWORD}.
  --help            Tampilkan bantuan ini

Catatan:
  - Password default semua akun: "${DEFAULT_PASSWORD}". Segera ganti lewat
    menu ganti password setelah login.
  - Akun kelas hanya bisa melihat & mengisi absensi kelasnya sendiri.
  - Akun admin (class = NULL) bisa mengakses semua halaman.
`);
}

async function connect() {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'rfid_attendance',
  });
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class         VARCHAR(20)  NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB
`;

async function resetPassword(db, username) {
  const [result] = await db.query('UPDATE users SET password_hash = ? WHERE username = ?', [
    hashPassword(DEFAULT_PASSWORD),
    username.toLowerCase(),
  ]);
  if (result.affectedRows === 0) {
    console.error(`Akun "${username}" tidak ditemukan.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Password akun "${username}" di-reset menjadi "${DEFAULT_PASSWORD}".`);
}

async function seedAccounts(db) {
  await db.query(CREATE_TABLE_SQL);

  const accounts = [[ADMIN_USERNAME, null], ...CLASS_ACCOUNTS];
  const passwordHash = hashPassword(DEFAULT_PASSWORD);

  let created = 0;
  for (const [username, className] of accounts) {
    const [result] = await db.query(
      'INSERT IGNORE INTO users (username, password_hash, class) VALUES (?, ?, ?)',
      [username.toLowerCase(), passwordHash, className]
    );
    created += result.affectedRows;
  }

  console.log(`Tabel users siap. ${created} akun baru dibuat (${accounts.length} total terdaftar).`);
  console.log(`Akun: ${accounts.map(([u]) => u).join(', ')}`);
  console.log(`Password default: "${DEFAULT_PASSWORD}"`);
  console.warn('PERINGATAN: Segera ganti password default setelah login pertama!');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const resetIndex = args.indexOf('--reset-password');
  const resetUsername = resetIndex >= 0 ? args[resetIndex + 1] : null;

  if (resetIndex >= 0 && !resetUsername) {
    console.error('--reset-password membutuhkan argumen username, contoh: node scripts/seed-users.mjs --reset-password xii.rpl.1');
    process.exitCode = 1;
    return;
  }

  const db = await connect();

  try {
    if (resetUsername) {
      await db.query(CREATE_TABLE_SQL);
      await resetPassword(db, resetUsername);
      return;
    }

    await seedAccounts(db);
  } catch (err) {
    console.error(`Seed gagal: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

await main();
