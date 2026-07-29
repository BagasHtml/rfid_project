# Dokumentasi Sistem Absensi RFID

## Daftar Isi

- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Database](#database)
- [Endpoint API](#endpoint-api)
- [Cara Menggunakan](#cara-menggunakan)
- [Alur Kerja Sistem](#alur-kerja-sistem)

---

## Arsitektur

Sistem menggunakan arsitektur **layered architecture** dengan 4 lapisan:

```
Browser (EJS / CSS / JS)
       |
   [HTTP / SSE]
       |
Express Router (routes/)
       |
Service Layer (services/)
       |
Repository Layer (repositories/)
       |
MySQL Database
```

| Lapisan | Peran |
|---------|-------|
| **View** | EJS templates + static files (CSS, JS) untuk UI |
| **Route** | Menangani HTTP request, validasi input via Zod, memanggil service |
| **Service** | Logic bisnis: proses absensi, tentu status tepat waktu/terlambat, handle duplikasi |
| **Repository** | Akses database via parameterized queries, return typed results |

Komponen tambahan:

- **SSE (Server-Sent Events)**: Real-time push notifikasi dari server ke client ketika ada absensi baru (`/api/attendance/stream`)
- **Middleware**: `requestLogger` (log request), `errorHandler` (error handling terpusat), `asyncHandler` (wrapper async route)
- **Graceful Shutdown**: Tangani `SIGTERM`/`SIGINT`, tutup HTTP server dan database pool dengan timeout 10 detik

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Node.js | - | Runtime |
| TypeScript | ^5.6 | Type safety |
| Express.js | ^4.21 | HTTP framework |
| MySQL2 | ^3.11 | Database driver (dengan pool connection) |
| EJS | ^3.1 | Template engine |
| Zod | ^4.4 | Validasi request |
| dotenv | ^16.4 | Environment variables |
| cors | ^2.8 | CORS handling |
| tsx | ^4.19 | TypeScript runtime (dev) |

---

## Struktur Proyek

```
rfid_project/
├── database/
│   ├── schema.sql           # Skema database (DDL)
│   └── seed.sql             # Data awal (DML)
├── public/
│   ├── css/
│   │   └── style.css        # Stylesheet
│   ├── images/
│   │   └── logo.webp        # Logo sekolah
│   └── js/
│       └── app.js           # Client-side JS (SSE, fetch, UI)
├── src/
│   ├── config/
│   │   ├── db.ts            # Koneksi database (pool)
│   │   └── env.ts           # Environment config
│   ├── middleware/
│   │   ├── asyncHandler.ts  # Wrapper async route handler
│   │   ├── errorHandler.ts  # Error handling terpusat
│   │   └── requestLogger.ts # Logging request
│   ├── repositories/
│   │   └── attendance.ts    # Query database untuk absensi
│   ├── routes/
│   │   ├── attendance.ts    # Route API absensi
│   │   └── pages.ts         # Route halaman web
│   ├── services/
│   │   └── attendance.ts    # Logic bisnis absensi
│   ├── sse/
│   │   └── clients.ts       # Manajemen koneksi SSE
│   ├── types/
│   │   └── index.ts         # Type definitions
│   ├── validators/
│   │   └── attendance.ts    # Zod validation schemas
│   ├── views/
│   │   ├── index.ejs        # Halaman utama
│   │   └── partials/
│   │       ├── header.ejs   # Header (logo + tanggal)
│   │       ├── table.ejs    # Tabel daftar absensi
│   │       └── status.ejs   # Status koneksi + toast container
│   └── index.ts             # Entry point aplikasi
├── .env                     # Environment variables
├── Dockerfile               # (jika ada)
├── package.json
├── tsconfig.json
├── BUGFIX_SUMMARY.md        # Ringkasan bug fixes
└── test-curl.sh             # Script testing API via curl
```

---

## Database

### Entity Relationship

```
students 1───* cards
students 1───* attendance
settings (key-value store)
```

### Tabel `students`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| nis | VARCHAR(20) UNIQUE | Nomor Induk Siswa |
| name | VARCHAR(100) | Nama siswa |
| class | VARCHAR(20) | Kelas |
| is_active | BOOLEAN | Status aktif (default TRUE) |
| created_at | TIMESTAMP | Dibuat |
| updated_at | TIMESTAMP | Diupdate |

### Tabel `cards`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| uid | VARCHAR(24) UNIQUE | ID unik kartu RFID |
| student_id | INT UNSIGNED FK | Foreign key ke students |
| is_active | BOOLEAN | Status aktif (default TRUE) |
| created_at | TIMESTAMP | Dibuat |

### Tabel `attendance`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| student_id | INT UNSIGNED FK | Foreign key ke students |
| date | DATE | Tanggal absensi |
| time | TIME | Jam absensi |
| status | ENUM('Hadir', 'Terlambat') | Status kehadiran |
| created_at | TIMESTAMP | Dibuat |

- **UNIQUE constraint** pada `(student_id, date)` untuk mencegah duplikasi (race condition handling)
- Index pada `date` dan `is_active`

### Tabel `settings`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| key | VARCHAR(50) PK | Key setting |
| value | VARCHAR(255) | Value setting |
| description | VARCHAR(255) | Deskripsi |
| updated_at | TIMESTAMP | Diupdate |

**Default settings:**
- `late_threshold` = `07:00:00` (batas jam keterlambatan)
- `school_name` = `SMK Negeri 1 Contoh`

### Cara Setup

```bash
# 1. Buat database
mysql -u root -p -e "CREATE DATABASE rfid_attendance"

# 2. Import schema
mysql -u root -p rfid_attendance < database/schema.sql

# 3. Import seed data
mysql -u root -p rfid_attendance < database/seed.sql
```

---

## Endpoint API

### 1. Health Check

```
GET /api/health
```

Cek status server dan koneksi database.

**Response 200:**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-07-29T10:00:00.000Z"
}
```

**Response 503 (DB disconnect):**
```json
{
  "status": "error",
  "db": "disconnected",
  "timestamp": "2026-07-29T10:00:00.000Z"
}
```

---

### 2. Absensi (POST)

```
POST /api/attendance
Content-Type: application/json

{
  "uid": "0412A3B5C2D1"
}
```

Mencatat absensi berdasarkan UID kartu RFID.

**Validasi UID:**
- Wajib diisi
- 8-24 karakter hexadecimal (0-9, A-F)
- Auto di-uppercase

**Response 200 (Berhasil):**
```json
{
  "success": true,
  "message": "Absensi berhasil",
  "student": {
    "name": "Bagas Pratama",
    "class": "XII RPL 5",
    "nis": "2024001"
  },
  "status": "Tepat Waktu",
  "time": "06:45:00"
}
```

**Response 409 (Duplikat - sudah absen hari ini):**
```json
{
  "is_duplicate": true,
  "message": "Sudah absen hari ini",
  "student": { "name": "...", "class": "...", "nis": "..." },
  "status": "Tepat Waktu",
  "time": "06:45:00"
}
```

**Response 409 (Kartu tidak dikenal):**
```json
{
  "success": false,
  "message": "Kartu tidak terdaftar"
}
```

**Response 400 (Validasi gagal):**
```json
{
  "success": false,
  "message": "Format UID tidak valid (8-24 karakter hex)"
}
```

---

### 3. Daftar Absensi Hari Ini

```
GET /api/attendance/today?limit=100&offset=0
```

Mendapatkan daftar absensi hari ini dengan pagination.

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| limit | number (1-200) | 100 | Jumlah data per halaman |
| offset | number (>=0) | 0 | Offset data |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "date": "2026-07-29",
      "time": "06:45:00",
      "status": "Tepat Waktu",
      "student_name": "Bagas Pratama",
      "student_class": "XII RPL 5",
      "student_nis": "2024001"
    }
  ],
  "total": 50
}
```

---

### 4. SSE Stream (Real-time)

```
GET /api/attendance/stream
```

Koneksi Server-Sent Events untuk menerima notifikasi real-time ketika ada absensi baru.

**Event: `attendance:new`**
Dikirim ketika ada absensi berhasil.
```json
{
  "name": "Bagas Pratama",
  "class": "XII RPL 5",
  "nis": "2024001",
  "time": "06:45:00",
  "status": "Tepat Waktu"
}
```

**Event: `attendance:duplicate`**
Dikirim ketika ada percobaan absensi duplikat.
```json
{
  "name": "Bagas Pratama",
  "class": "XII RPL 5",
  "nis": "2024001",
  "time": "06:45:00",
  "status": "Tepat Waktu"
}
```

**Spesifikasi Koneksi:**
- Max 100 client bersamaan
- Heartbeat setiap 30 detik
- Timeout client setelah 90 detik tidak ada aktivitas
- Auto-reconnect di client dengan exponential backoff

---

### 5. Halaman Web

```
GET /
```

Render halaman utama absensi (EJS template) yang menampilkan:
- Kartu scan RFID
- Daftar absensi hari ini (tabel dengan pagination)
- Status koneksi real-time
- Toast notification untuk absensi baru

---

## Cara Menggunakan

### 1. Persiapan

```bash
# Clone/download project
cd rfid_project

# Install dependencies
npm install
# atau
bun install

# Setup database
mysql -u root -p -e "CREATE DATABASE rfid_attendance"
mysql -u root -p rfid_attendance < database/schema.sql
mysql -u root -p rfid_attendance < database/seed.sql

# Konfigurasi environment (edit .env)
# PORT=3000
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=rfid_attendance
# LATE_THRESHOLD=07:00:00
# CORS_ORIGIN=http://localhost:4321
```

### 2. Menjalankan

```bash
# Development
npm run dev
# atau
bun run src/index.ts

# Production
npm run build
npm start
```

### 3. Testing API

```bash
# Health check
curl http://localhost:3000/api/health

# Absen (UID valid dari seed data)
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"uid": "0412A3B5C2D1"}'

# Lihat daftar hari ini
curl "http://localhost:3000/api/attendance/today?limit=10&offset=0"

# SSE stream (terminal terpisah)
curl -N http://localhost:3000/api/attendance/stream
```

### 4. Seed Data (UID Kartu)

| Nama | NIS | UID Kartu |
|------|-----|-----------|
| Bagas Pratama | 2024001 | `0412A3B5C2D1` |
| Siti Aminah | 2024002 | `04F8C2A1B3E9` |
| Andi Saputra | 2024003 | `04A1D7F3C8B2` |
| Dewi Lestari | 2024004 | `04B9E2C7D1A6` |
| Rizky Ramadhan | 2024005 | `04C3F1A8B5D0` |
| Putri Handayani | 2024006 | `04D7B6C9E2F4` |
| Fajar Nugroho | 2024007 | `04E5A0D3F7C1` |
| Nabila Zahra | 2024008 | `04F2C8B1A6E3` |

---

## Alur Kerja Sistem

### Alur Absensi (Tap RFID)

```
1. Kartu RFID ditempelkan ke reader
2. Reader mengirim UID ke server via POST /api/attendance
3. Server validasi format UID (Zod)
4. Server cari kartu aktif dengan UID tersebut (JOIN cards + students)
   ├── Jika tidak ditemukan → 409 "Kartu tidak terdaftar"
   └── Jika ditemukan:
       ├── Cek apakah sudah absen hari ini (UNIQUE constraint)
       │   ├── Jika sudah → 409 "Sudah absen hari ini" + SSE event
       │   └── Jika belum:
       │       ├── Tentukan status (Tepat Waktu / Terlambat)
       │       ├── Insert ke database
       │       │   ├── Jika ER_DUP_ENTRY (race condition) → handle graciously
       │       │   └── Jika sukses:
       │       │       ├── Broadcast via SSE ke semua client
       │       │       └── Response 200 ke reader
       │       └── (Error lain → throw, tangani di errorHandler)
```

### Alur Real-time (SSE)

```
1. Client browser connect ke GET /api/attendance/stream
2. Server registrasi client, kirim heartbeat tiap 30 detik
3. Ketika ada absensi baru, server broadcast event ke semua client
4. Client JS menerima event, update UI (toast + animasi)
5. Jika koneksi putus, client auto-reconnect dengan exponential backoff
   (1s, 2s, 4s, 8s, ... max 30s, max 10 attempts)
```

### Penentuan Status

```
current_time <= late_threshold → "Tepat Waktu"
current_time >  late_threshold → "Terlambat"
```

- `late_threshold` bisa dikonfigurasi via environment variable `LATE_THRESHOLD` (default: `07:00:00`)
- Bisa juga diset per-instansi via tabel `settings` key `late_threshold` (lebih prioritas dari env)

---

## Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port server |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:4321` | Origin CORS |
| `DB_HOST` | `localhost` | Host database |
| `DB_PORT` | `3306` | Port database |
| `DB_USER` | `root` | User database |
| `DB_PASSWORD` | (kosong) | Password database |
| `DB_NAME` | `rfid_attendance` | Nama database |
| `LATE_THRESHOLD` | `07:00:00` | Batas jam keterlambatan |

---
