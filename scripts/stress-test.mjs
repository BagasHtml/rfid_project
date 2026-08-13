#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadDotEnv } from 'dotenv';
import mysql from 'mysql2/promise';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv({ path: resolve(projectRoot, '.env') });

const DEFAULT_URL = 'http://localhost:3000';
const STRESS_CLASS = 'STRESS';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    url: DEFAULT_URL,
    count: 1200,
    concurrency: 200,
    seed: true,
    cleanup: true,
    username: 'admin',
    password: 'ganti123',
    classUser: 'xii.rpl.1',
    classPassword: 'ganti123',
  };

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const value = args[i + 1];
    switch (key) {
      case '--url':
        opts.url = value;
        i++;
        break;
      case '--count':
        opts.count = parseInt(value, 10);
        i++;
        break;
      case '--concurrency':
        opts.concurrency = parseInt(value, 10);
        i++;
        break;
      case '--username':
        opts.username = value;
        i++;
        break;
      case '--password':
        opts.password = value;
        i++;
        break;
      case '--class-user':
        opts.classUser = value;
        i++;
        break;
      case '--class-password':
        opts.classPassword = value;
        i++;
        break;
      case '--no-seed':
        opts.seed = false;
        break;
      case '--keep':
        opts.cleanup = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Argumen tidak dikenal: ${key}`);
        printHelp();
        process.exit(1);
    }
  }

  if (!Number.isInteger(opts.count) || opts.count < 1) {
    console.error('--count harus bilangan bulat >= 1');
    process.exit(1);
  }
  if (!Number.isInteger(opts.concurrency) || opts.concurrency < 1) {
    console.error('--concurrency harus bilangan bulat >= 1');
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
Stress test absensi RFID - simulasi N siswa men-tap bersamaan.

Pemakaian:
  node scripts/stress-test.mjs [opsi]

Opsi:
  --url <url>              Base URL server (default: ${DEFAULT_URL})
  --count <n>              Jumlah siswa/kartu yang disimulasikan (default: 1200)
  --concurrency <n>        Request serentak maksimal (default: 200)
  --username <user>        Akun untuk menembak tap (default: admin)
  --password <pass>        Password akun tersebut (default: ganti123)
  --class-user <user>      Akun kelas untuk uji tap lintas kelas (default: xii.rpl.1)
  --class-password <pass>  Password akun kelas tersebut (default: ganti123)
  --no-seed                Jangan seed data; pakai data STRESS yang sudah ada
  --keep                   Jangan hapus data stress setelah selesai
  --help                   Tampilkan bantuan ini

Catatan:
  - Seed menulis langsung ke database (via .env DB_*) agar tidak kena
    rate limit endpoint registrasi.
  - Data stress ditandai class='STRESS' dan dihapus otomatis (kecuali --keep).
  - Verdict AMAN berarti tidak ada 429/503/500 pada beban tersebut.
  - Sebelum stress, jalankan: node scripts/seed-users.mjs (membuat akun admin & kelas).
`);
}

let pool = null;
function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'rfid_attendance',
    connectionLimit: 10,
  });
  return pool;
}

async function seed(count) {
  const db = getPool();
  const runId = Date.now();
  const prefix = runId.toString(36).toUpperCase();
  const uidBase = BigInt(runId) * 1000000n;

  const students = [];
  const uids = [];
  for (let i = 0; i < count; i++) {
    const nis = `S${prefix}${i.toString(36).toUpperCase()}`;
    students.push([nis, `Siswa Stress ${i + 1}`, STRESS_CLASS, 1]);
    uids.push((uidBase + BigInt(i)).toString(16).toUpperCase());
  }

  console.log(`Seeding ${count} siswa + kartu (run ${runId})...`);
  await db.query('INSERT INTO students (nis, name, class, is_active) VALUES ?', [students]);

  const [rows] = await db.query('SELECT id, nis FROM students WHERE class = ?', [STRESS_CLASS]);
  const nisToId = new Map(rows.map(r => [r.nis, r.id]));

  const cards = [];
  for (let i = 0; i < count; i++) {
    const studentId = nisToId.get(`S${prefix}${i.toString(36).toUpperCase()}`);
    if (studentId === undefined) {
      throw new Error(`Siswa seed tidak ditemukan untuk index ${i}`);
    }
    cards.push([uids[i], studentId, 1]);
  }

  await db.query('INSERT INTO cards (uid, student_id, is_active) VALUES ?', [cards]);
  console.log(`Seed selesai: ${count} kartu siap di-tap.\n`);
}

async function loadUids(count) {
  const db = getPool();
  const [rows] = await db.query(
    `SELECT c.uid FROM cards c JOIN students s ON s.id = c.student_id WHERE s.class = ?`,
    [STRESS_CLASS]
  );
  const uids = rows.map(r => r.uid);
  if (uids.length < count) {
    throw new Error(
      `Data stress tidak cukup: ada ${uids.length} kartu STRESS, butuh ${count}. Jalankan seed dulu atau pakai --count yang lebih kecil.`
    );
  }
  return uids.slice(0, count);
}

function mapConcurrent(items, limit, worker) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let next = 0;
    let active = 0;
    let done = 0;
    let settled = false;

    function pump() {
      while (active < limit && next < items.length) {
        const idx = next++;
        active++;
        Promise.resolve()
          .then(() => worker(items[idx], idx))
          .then(r => {
            results[idx] = r;
          })
          .catch(e => {
            results[idx] = e;
          })
          .finally(() => {
            active--;
            done++;
            pump();
            if (done === items.length && !settled) {
              settled = true;
              resolve(results);
            }
          });
      }
    }

    pump();
  });
}

async function login({ url, username, password }) {
  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const sid = cookies.find(c => c.trimStart().startsWith('sid='));

  if (!data.success || !sid) {
    throw new Error(
      `Login gagal sebagai "${username}" (HTTP ${res.status}). Jalankan "node scripts/seed-users.mjs" lalu pastikan username/password benar.`
    );
  }

  return sid.trim().split(';')[0];
}

async function runStress({ url, count, concurrency, username, password }) {
  const cookie = await login({ url, username, password });
  console.log(`Login berhasil sebagai "${username}", sesi diambil untuk tap.\n`);

  const uids = await loadUids(count);
  console.log(`Menembak ${count} tap ke ${url}/api/attendance (concurrency ${concurrency})...`);

  const startedAt = performance.now();
  const results = await mapConcurrent(uids, concurrency, async uid => {
    const start = performance.now();
    let status;
    try {
      const res = await fetch(`${url}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ uid }),
      });
      status = res.status;
    } catch {
      status = 'NETWORK_ERROR';
    }
    return { status, ms: performance.now() - start };
  });
  const elapsedSec = (performance.now() - startedAt) / 1000;

  report(results, elapsedSec);
}

async function runCrossClass403({ url, classUser, classPassword, uid }) {
  console.log(`\nUji isolasi kelas: login sebagai "${classUser}" lalu tap kartu kelas lain (STRESS)...`);

  let cookie;
  try {
    cookie = await login({ url, username: classUser, password: classPassword });
  } catch (err) {
    console.log(`  Skipped: ${err.message}`);
    return;
  }

  const res = await fetch(`${url}/api/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ uid }),
  });

  if (res.status === 403) {
    console.log('  VERIFIED: tap kartu lintas kelas ditolak (403) — isolasi per kelas aman.');
  } else {
    console.log(`  GAGAL: seharusnya 403, tapi server merespons HTTP ${res.status}. Periksa scoping tap!`);
  }
}

function report(results, elapsedSec) {
  const byStatus = new Map();
  const latencies = [];
  for (const r of results) {
    const key = r instanceof Error ? 'EXCEPTION' : r.status;
    byStatus.set(key, (byStatus.get(key) || 0) + 1);
    if (typeof r?.ms === 'number') latencies.push(r.ms);
  }

  latencies.sort((a, b) => a - b);
  const pct = p => (latencies.length ? latencies[Math.floor((p / 100) * (latencies.length - 1))] : 0);
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  console.log('\n=== Hasil Stress Test ===');
  console.log(`Total request : ${results.length}`);
  console.log(`Durasi        : ${elapsedSec.toFixed(2)} detik`);
  console.log(`Throughput    : ${(results.length / elapsedSec).toFixed(1)} req/detik`);
  console.log(`Latency       : avg ${avg.toFixed(1)} ms | p50 ${pct(50).toFixed(1)} ms | p95 ${pct(95).toFixed(1)} ms | p99 ${pct(99).toFixed(1)} ms`);
  for (const [key, value] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  HTTP ${key}: ${value}`);
  }

  const success = byStatus.get(200) || 0;
  const duplicate = byStatus.get(409) || 0;
  const problems =
    (byStatus.get(429) || 0) +
    (byStatus.get(500) || 0) +
    (byStatus.get(503) || 0) +
    (byStatus.get('NETWORK_ERROR') || 0) +
    (byStatus.get('EXCEPTION') || 0);

  console.log('\nInterpretasi:');
  console.log(`  - 200 (berhasil): ${success}`);
  console.log(`  - 409 (duplikat): ${duplicate}`);
  if (problems === 0) {
    console.log('VERDICT: AMAN — tidak ada 429/503/500/network error pada beban ini.');
  } else {
    console.log(`VERDICT: ADA MASALAH — ${problems} request ditolak/gagal. Periksa log server (rate limit / DB pool / SSE).`);
  }
}

async function cleanup() {
  const db = getPool();
  await db.query(
    `DELETE a FROM attendance a JOIN students s ON s.id = a.student_id WHERE s.class = ?`,
    [STRESS_CLASS]
  );
  await db.query(
    `DELETE c FROM cards c JOIN students s ON s.id = c.student_id WHERE s.class = ?`,
    [STRESS_CLASS]
  );
  await db.query('DELETE FROM students WHERE class = ?', [STRESS_CLASS]);
}

async function main() {
  const opts = parseArgs();

  try {
    if (opts.seed) {
      await seed(opts.count);
    }
    await runStress(opts);
    if (opts.cleanup) {
      const uids = await loadUids(Math.min(opts.count, 1));
      if (uids.length > 0) {
        await runCrossClass403({ ...opts, uid: uids[0] });
      }
      await cleanup();
      console.log('\nCleanup: data stress (class=STRESS) sudah dihapus dari database.');
    }
  } catch (err) {
    console.error(`\nStress test gagal: ${err.message}`);
    process.exitCode = 1;
    if (opts.seed && opts.cleanup) {
      try {
        await cleanup();
        console.log('Cleanup: sisa data stress dihapus.');
      } catch (cleanupErr) {
        console.error(`Cleanup gagal: ${cleanupErr.message}`);
      }
    }
  } finally {
    if (pool) await pool.end();
  }
}

await main();
