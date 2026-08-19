# Dokumentasi Sistem Absensi RFID

Sistem absensi berbasis kartu RFID untuk **SMK Taruna Bangsa** (multi-kelas). Terdiri dari **reader/ESP32**, **server API** (Node.js + Express + TypeScript), dan **dashboard web** real-time dengan sistem **login & peran** (admin + wali kelas), desain modern ala Lessa (sidebar hijau-emerald, metric bar, notifikasi live via SSE).

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tangkapan Layar](#tangkapan-layar)
- [Desain UI/UX](#desain-uiux)
  - [Dark Mode](#dark-mode)
- [Autentikasi & Peran](#autentikasi--peran)
- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Database](#database)
- [Endpoint API](#endpoint-api)
- [Rate Limiting](#rate-limiting)
- [Penanganan Error](#penanganan-error)
- [Cara Menggunakan](#cara-menggunakan)
- [Scripts](#scripts)
- [Alur Kerja Sistem](#alur-kerja-sistem)
  - [Alur Status Manual (Admin)](#alur-status-manual-admin)
- [Environment Variables](#environment-variables)

---

## Fitur Utama

- **Login & logout** dengan sesi aman (cookie `sid` bertanda HMAC-SHA256, berlaku 12 jam).
- **Dua peran**: **Admin** (class = NULL) dan **Wali Kelas** (memiliki `class`).
- **Pembatasan akses per kelas** — wali kelas hanya bisa melihat/input absensi kelasnya sendiri (ditegakkan di API dan SSE real-time).
- **Pemantauan kehadiran siswa** (admin): status **Belum Absen / Tepat Waktu / Terlambat / Alpha / Izin / Sakit / Dispen** per siswa per hari, dengan pencarian & pagination.
- **Manajemen status manual** (admin): ubah status absensi siswa (Alpha, Izin, Sakit, Dispen) dengan keterangan opsional, langsung dari tabel pemantauan.
- **Manajemen kelas & akun wali** (admin): buat kelas (otomatis membuat akun wali), reset password default, hapus akun wali.
- **Riwayat absensi per siswa** (modal, klik baris).
- **Live update** via SSE (event `attendance:new`, `attendance:duplicate`) — di-filter per kelas.
- **Dark mode toggle** — tema gelap/terang dapat di-switch manual via tombol di topbar, preference tersimpan di `localStorage`.
- **Pagination** dengan batas maksimal per endpoint (defense-in-depth).
- **Rate limiting** per UID / per IP / per username login.

---

## Tangkapan Layar

### Halaman Login (`/login`)

![Halaman Login](docs/screenshots/halaman-login.png)

Form masuk dengan username & password. Redirect otomatis sesuai peran (admin → `/`, wali kelas → `/kelas/:nama-kelas`).

### Halaman Absensi Admin (`/`)

![Halaman Absensi](docs/screenshots/halaman-absensi.png)

Dashboard admin: sidebar navigasi, metric bar (Total Siswa / Hadir / Terlambat / Belum Absen), kartu scan RFID, tabel pemantauan kehadiran siswa (dengan filter kelas, pencarian, dan kolom Aksi untuk ubah status manual), serta kelola kelas & akun wali.

### Halaman Absensi Kelas (`/kelas/:namaKelas`)

![Halaman Absensi Kelas](docs/screenshots/halaman-absensi-kelas.png)

Dashboard wali kelas: metric bar, kartu scan RFID, dan tabel absensi **kelasnya sendiri** (badge nama kelas).

### Halaman Registrasi Kartu (`/register`)

![Halaman Registrasi Kartu](docs/screenshots/halaman-register-kartu.png)

Form pendaftaran kartu (UID + pilih siswa) dan tabel kartu terdaftar.

### Halaman Daftar Siswa (`/students`)

![Halaman Daftar Siswa](docs/screenshots/halaman-daftar-siswa.png)

Form pendaftaran siswa, tabel siswa (dengan pencarian), edit/hapus, dan riwayat absensi.

---

## Desain UI/UX

Dashboard diredesain dengan gaya **Lessa** — ringan, emerald, dan modern. Seluruh warna memakai CSS custom properties di `public/css/style.css` dengan support **dark mode** via `data-theme="dark"`.

| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `#00A37A` | `#00A37A` |
| `--accent` | `#FF8C32` | `#FF8C32` |
| `--canvas` | `#F4F5F7` | `#0F1117` |
| `--surface` | `#FFFFFF` | `#1A1D23` |
| `--text` | `#1A1D1E` | `#E4E7EC` |
| `--text-soft` | `#8A94A6` | `#7C839A` |
| `--border` | `#EAECEF` | `#2C3038` |
| Radius | 12–20 px | 12–20 px |
| Font | Plus Jakarta Sans (Google Fonts) | Plus Jakarta Sans (Google Fonts) |

**Layout:**

```
┌──────────────┬──────────────────────────────────────┐
│              │  Topbar: judul + tanggal + [?] +     │
│   Sidebar    │  pill koneksi + user pill + logout   │
│   (240px)    ├──────────────────────────────────────┤
│   logo       │  Metric bar 4 kolom:                 │
│   Menu       │  [Total] [Hadir] [Terlambat] [Belum] │
│   (per role) ├──────────────────────────────────────┤
│  promo card  │  Kartu scan RFID (input UID)         │
│              ├──────────────────────────────────────┤
│              │  Pemantauan kehadiran (tabel + aksi)  │
│              │  Kelola kelas & akun wali             │
└──────────────┴──────────────────────────────────────┘

Container max-width: 1280px (diperlebar dari 1100px)
```

**Fitur UI:**

- **Sidebar tetap** (240 px desktop, off-canvas di mobile) menyesuaikan peran: admin melihat `Absensi` / `Daftar Kartu` / `Daftar Siswa`, wali kelas hanya melihat `Absensi Kelas`.
- **Metric bar** menampilkan 4 angka: **Total Siswa**, **Hadir**, **Terlambat**, **Belum Absen** — ter-update otomatis via SSE setiap ada tap baru.
- **Connection pill** di topbar (halaman absensi saja) menunjukkan status koneksi real-time (hijau = terhubung, oranye = menghubung, merah = putus).
- **Theme toggle** di topbar — tombol ikon matahari/bulan untuk switch light ↔ dark mode. Preference tersimpan di `localStorage('theme')`. Flash prevention script di `<head>` mencegah kedip saat load.
- **User pill** menampilkan peran (Admin / nama kelas) dan username, plus tombol **Keluar**.
- **Toast notification** muncul saat ada absensi baru (sukses/duplikat/error).
- **Modal riwayat absensi** — klik baris siswa untuk melihat riwayat 30 hari terakhir.
- **Kolom Aksi** (admin) — dropdown status + input keterangan + tombol Simpan, untuk mengatur status manual (Alpha/Izin/Sakit/Dispen) atau mengubah status yang sudah ada.
- **Cache-busting** `?v=...` pada `style.css` dan semua file JS.

### Dark Mode

Dark mode diaktifkan dengan menambahkan `data-theme="dark"` pada element `<html>`. Implementasi:

- **Flash prevention**: Script inline di `<head>` setiap halaman membaca `localStorage('theme')` sebelum CSS load, mencegah kedip (flash of wrong theme).
- **CSS Variables**: Semua warna menggunakan CSS custom properties. Dark mode meng-override variabel di `[data-theme="dark"]` selector.
- **Toggle button**: Tombol ikon matahari/bulan di topbar (header.ejs), tersedia untuk semua user yang login.
- **Persistence**: Preference tersimpan di `localStorage('theme')` (`'dark'` atau `'light'`).
- **Scope**: Override mencakup sidebar, cards, tables, status badges, modals, forms, scan card states, login page, dan semua komponen UI.

| Komponen | Light | Dark |
|----------|-------|------|
| Canvas (bg) | `#F4F5F7` | `#0F1117` |
| Surface (card) | `#FFFFFF` | `#1A1D23` |
| Text | `#1A1D1E` | `#E4E7EC` |
| Border | `#EAECEF` | `#2C3038` |
| Table header | `#FAFBFC` | `#14171D` |
| Metric bar | `#00A37A` gradient | `#006B50` gradient |
| Status badges | Light pastel bg | Low-opacity tint bg |

---

## Autentikasi & Peran

- **Sesi**: token `base64url(JSON payload) + HMAC-SHA256 signature` disimpan di cookie `sid` (`HttpOnly`, `SameSite=Lax`, `Secure` di production). TTL 12 jam.
- **Password**: di-hash dengan `scrypt` (salt 16-byte acak, format `scrypt:<salt>:<hash>`), verifikasi memakai `timingSafeEqual`.
- **Peran** ditentukan dari kolom `users.class`:
  - `class = NULL` → **admin** (akses semua halaman/kelas).
  - `class = "XII RPL 1"` → **wali kelas** (hanya kelas tersebut).
- **Class scope** ditegakkan di `src/middleware/auth.ts` (`enforceClassScope`): non-admin yang meminta data kelas lain mendapat `403`.
- **Akun default** dibuat via `npm run seed:users` — lihat [Cara Menggunakan](#cara-menggunakan).

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
| **Route** | Menangani HTTP request, validasi input via Zod (middleware `validate`/`validateQuery`), memanggil service |
| **Service** | Logic bisnis: proses absensi, tentu status tepat waktu/terlambat, registrasi kartu, login, kelola kelas |
| **Repository** | Akses database via Drizzle ORM (parameterized queries), return typed results; pagination di-clamp internal (`clampPagination`) sebagai defense-in-depth |

Komponen tambahan:

- **SSE (Server-Sent Events)**: Real-time push notifikasi ketika ada absensi baru (`/api/attendance/stream`), di-filter per kelas wali.
- **Autentikasi**: `requireAuth` (parse & verifikasi cookie sesi), `requireAdmin`, `enforceClassScope`, `requirePageAuth`/`requirePageAdmin` untuk halaman.
- **Middleware**: `requestLogger`, `errorHandler` (error handling terpusat + telusur `cause`), `asyncHandler` (wrapper async route), `validate`/`validateQuery` (Zod), `rateLimit` (anti-spam).
- **Result helpers**: `ok()`/`fail()` di `src/utils/http.ts` untuk membentuk respons JSON sukses/gagal secara konsisten.
- **Graceful Shutdown**: tangani `SIGTERM`/`SIGINT`, tutup HTTP server dan database pool dengan timeout 10 detik.

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Node.js | - | Runtime |
| TypeScript | ^5.6 | Type safety |
| Express.js | ^4.21 | HTTP framework |
| MySQL2 | ^3.11 | Database driver (dengan pool connection) |
| Drizzle ORM | ^0.45 | Query builder + schema typed |
| EJS | ^3.1 | Template engine |
| Zod | ^4.4 | Validasi request |
| Helmet | ^8.3 | Security headers (termasuk CSP) |
| express-rate-limit | ^8.6 | Rate limiting |
| dotenv | ^16.4 | Environment variables |
| tsx | ^4.19 | TypeScript runtime (dev) |
| node:crypto | built-in | scrypt (password) + HMAC-SHA256 (sesi) |

---

## Struktur Proyek

```
rfid_project/
├── database/
│   ├── schema.sql           # Skema database (DDL - referensi)
│   └── seed.sql             # Data awal siswa (DML)
├── public/
│   ├── css/
│   │   └── style.css        # Stylesheet
│   ├── images/
│   │   └── logo.webp        # Logo sekolah
│   └── js/
│       ├── http.js          # Helper fetch (auth, error handling)
│       ├── login.js         # Client JS halaman login
│       ├── app.js           # Client JS absensi (SSE, fetch, UI, theme toggle)
│       ├── admin.js         # Client JS admin (monitor, kelas, status manual, riwayat)
│       ├── register.js      # Client JS halaman registrasi kartu
│       └── students.js      # Client JS halaman manajemen siswa
├── scripts/
│   ├── seed-users.mjs       # Seed akun admin + wali kelas (scrypt)
│   └── stress-test.mjs      # Stress test absensi (concurrent)
├── src/
│   ├── config/
│   │   └── env.ts           # Environment config (validasi Zod)
│   ├── db/
│   │   ├── index.ts         # Drizzle client
│   │   ├── pool.ts          # Connection pool mysql2 (config koneksi DB)
│   │   ├── helpers.ts       # getInsertId(), getAffectedRows(), countRows(), findFirst(), clampPagination()
│   │   └── schema.ts        # Definisi tabel (students, cards, attendance, settings, users)
│   ├── mappers/
│   │   ├── attendance.ts    # Mapping query → AttendanceRecord / AttendanceWithStudent / StudentStatus (with attendanceId + keterangan)
│   │   ├── card.ts          # Mapping query → CardWithStudent / CardRecord
│   │   └── student.ts       # Mapping query → StudentRecord
│   ├── middleware/
│   │   ├── asyncHandler.ts  # Wrapper async route handler
│   │   ├── auth.ts          # requireAuth, requireAdmin, enforceClassScope, requirePageAuth/Admin
│   │   ├── errorHandler.ts  # Error handling terpusat (root cause aware)
│   │   ├── rateLimit.ts     # Rate limiter per-UID / per-IP / per-username
│   │   ├── requestLogger.ts # Logging request
│   │   └── validate.ts      # Validasi body (validate) & query (validateQuery)
│   ├── repositories/
│   │   ├── attendance.ts    # Query absensi (+ stats, status per siswa, riwayat, update status, insert manual)
│   │   ├── card.ts          # Query kartu
│   │   ├── setting.ts       # Query settings (dengan cache in-memory 10 detik)
│   │   ├── student.ts       # Query siswa (+ search, bulk insert)
│   │   └── user.ts          # Query akun users (login, akun wali kelas)
│   ├── routes/
│   │   ├── attendance.ts    # API absensi + status + SSE + ubah status + manual
│   │   ├── cards.ts         # API registrasi/daftar kartu
│   │   ├── students.ts      # API siswa (CRUD, import, riwayat)
│   │   ├── auth.ts          # API login/logout/ganti password/me
│   │   ├── admin.ts         # API kelola kelas & akun wali
│   │   └── pages.ts         # Route halaman web (/, /login, /kelas, /register, /students)
│   ├── services/
│   │   ├── attendance.ts    # Logic absensi (+ getTodayList/getStatusList + updateStatus + setManualStatus)
│   │   ├── cards.ts         # Logic registrasi kartu
│   │   ├── students.ts      # Logic siswa (CRUD, import, riwayat)
│   │   ├── auth.ts          # Logic login/logout/ganti password
│   │   └── admin.ts         # Logic kelola kelas & akun wali
│   ├── sse/
│   │   └── clients.ts       # Manajemen koneksi SSE (heartbeat, filter kelas, broadcast)
│   ├── types/
│   │   ├── attendance.ts    # Type AttendanceRecord (+ keterangan), AttendanceResult, AttendanceStatus (6 opsi)
│   │   ├── card.ts          # Type CardWithStudent, CardRecord
│   │   ├── student.ts       # Type StudentInfo, StudentRecord
│   │   ├── user.ts          # Type AuthUser, LoginResult
│   │   └── admin.ts         # Type ClassListEntry, AdminActionResult
│   ├── utils/
│   │   ├── auth.ts          # scrypt hash/verify, sesi HMAC (create/verify), cookie
│   │   ├── date.ts          # Tanggal/waktu timezone-aware + determineStatus
│   │   ├── error.ts         # rootCause() & isDuplicateEntryError()
│   │   ├── format.ts        # buildStudentInfo(), normalizeClassName()
│   │   ├── http.ts          # sendResult(), ok(), fail()
│   │   └── insert.ts        # writeOrDuplicate() — insert dengan graceful duplicate
│   ├── validators/
│   │   ├── attendance.ts    # Zod schema absensi + query today/status + UpdateStatus + ManualAttendance
│   │   ├── cards.ts         # Zod schema registrasi kartu
│   │   ├── students.ts      # Zod schema siswa (CRUD, import, query, history)
│   │   ├── auth.ts          # Zod schema login / ganti password
│   │   └── admin.ts         # Zod schema nama kelas
│   ├── views/
│   │   ├── login.ejs        # Halaman login
│   │   ├── index.ejs        # Dashboard admin (absensi + pemantauan + kelas)
│   │   ├── perkelas.ejs     # Dashboard wali kelas
│   │   ├── register.ejs     # Halaman registrasi kartu
│   │   ├── students.ejs     # Halaman manajemen siswa
│   │   └── partials/
│   │       ├── header.ejs   # Sidebar + topbar (peran, connection pill, logout)
│   │       ├── footer.ejs   # Penutup layout + script cache-busting
│   │       ├── table.ejs    # Tabel daftar absensi
│   │       └── status.ejs   # Toast container
│   └── index.ts             # Entry point aplikasi
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
├── BUGFIX_SUMMARY.md        # Ringkasan bug fixes
└── test-curl.sh             # Script testing API via curl
```

---

## Database

### Entity Relationship

```
users (admin / wali kelas)
students 1───* cards
students 1───* attendance
settings (key-value store)
```

### Tabel `students`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| nis | VARCHAR(32) UNIQUE | Nomor Induk Siswa (unique index `uq_students_nis`) |
| name | VARCHAR(128) | Nama siswa |
| class | VARCHAR(16) | Kelas |
| is_active | BOOLEAN | Status aktif (default TRUE) |

### Tabel `cards`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| uid | VARCHAR(32) UNIQUE | ID unik kartu RFID (unique index `uq_cards_uid`) |
| student_id | INT UNSIGNED FK | Foreign key ke students (RESTRICT, CASCADE) |
| is_active | BOOLEAN | Status aktif (default TRUE) |
| created_at | TIMESTAMP | Waktu kartu didaftarkan (nullable) |

### Tabel `attendance`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| student_id | INT UNSIGNED FK | Foreign key ke students (RESTRICT, CASCADE) |
| date | DATE | Tanggal absensi |
| time | TIME | Jam absensi |
| status | VARCHAR(20) | `Tepat Waktu` / `Terlambat` / `Alpha` / `Izin` / `Sakit` / `Dispen` |
| keterangan | VARCHAR(255) NULL | Catatan opsional (misalnya alasan izin/sakit) |

- **UNIQUE constraint** `uq_attendance_student_date` pada `(student_id, date)` untuk mencegah duplikasi (race condition handling)
- **FK `student_id`** RESTRICT: siswa dengan data kartu/absensi tidak dapat dihapus (blokir `DELETE /students/:id`)

### Tabel `settings`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| key | VARCHAR(64) PK | Key setting |
| value | VARCHAR(255) | Value setting |

**Default settings:**
- `late_threshold` = `07:00:00` (batas jam keterlambatan, dibaca dengan cache in-memory **10 detik**)

### Tabel `users`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| username | VARCHAR(50) UNIQUE | Username login (unique index `uq_users_username`) |
| password_hash | VARCHAR(255) | Hash password (scrypt) |
| class | VARCHAR(20) NULL | Kelas wali; `NULL` berarti admin |
| created_at | TIMESTAMP | Waktu akun dibuat (nullable) |

> **Catatan:** `database/seed.sql` saat ini hanya berisi siswa contoh (kelas XI RPL 5). Tabel `cards` **tidak** di-seed — kartu RFID didaftarkan lewat halaman `/register` atau endpoint `POST /api/cards`. Akun pengguna dibuat via `npm run seed:users` atau `POST /api/admin/classes`.

> **Catatan:** `database/schema.sql` hanyalah referensi DDL. Definisi tabel resmi untuk aplikasi ada di `src/db/schema.ts` — termasuk **FK** (`cards.student_id`, `attendance.student_id`) dan **unique index** (`uq_cards_uid`, `uq_students_nis`, `uq_attendance_student_date`, `uq_users_username`). Sinkronkan database dari definisi resmi dengan `npm run db:push` (atau `npm run db:migrate`).

### Cara Setup

```bash
# 1. Buat database
mysql -u root -p -e "CREATE DATABASE rfid_attendance"

# 2. Sinkronkan skema (definisi resmi: src/db/schema.ts)
npm run db:push

# 3. Import seed data siswa (opsional, data contoh)
mysql -u root -p rfid_attendance < database/seed.sql

# 4. Seed akun login (admin + wali kelas) — password default "ganti123"
npm run seed:users
```

> **Migration manual:** Jika database sudah ada sebelum penambahan kolom `keterangan`, jalankan:
> ```sql
> ALTER TABLE attendance ADD COLUMN keterangan VARCHAR(255) NULL AFTER status;
> ```

---

## Endpoint API

Semua respons API berupa JSON. Endpoint di bawah `/api/*` **wajib login** (kecuali `/api/auth/login` dan `/api/health`); tanpa sesi valid server mengembalikan `401`. Endpoint yang tidak dikenal di bawah `/api/*` mengembalikan `404` JSON.

### 1. Health Check

```
GET /api/health
```

Cek status server dan koneksi database.

**Response 200:**
```json
{
  "status": "aman",
  "db": "tersambung",
  "timestamp": "2026-08-13T10:00:00.000Z"
}
```

**Response 503 (DB disconnect):**
```json
{
  "status": "error",
  "db": "disconnected",
  "timestamp": "2026-08-13T10:00:00.000Z"
}
```

---

### 2. Autentikasi

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "ganti123"
}
```

**Rate limit:** 5 percobaan/menit per username + 20/menit per IP.

**Response 200:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "user": { "id": 1, "username": "admin", "class": null, "role": "admin" }
}
```
Cookie sesi (`sid`) di-set via header `Set-Cookie`.

**Response 401:**
```json
{ "success": false, "message": "Username atau password salah" }
```

#### Logout

```
POST /api/auth/logout
```

Menghapus cookie `sid`.

#### Ganti Password

```
POST /api/auth/change-password
Content-Type: application/json

{
  "old_password": "ganti123",
  "new_password": "rahasia123"
}
```

**Response 200:** `{ "success": true, "message": "Password berhasil diubah" }`
**Response 400:** `{ "success": false, "message": "Password lama salah" }`

#### Info Sesi

```
GET /api/auth/me
```

Mengembalikan `{ "success": true, "user": { id, username, class, role } }` berdasarkan cookie sesi.

---

### 3. Absensi (POST)

```
POST /api/attendance
Content-Type: application/json

{
  "uid": "0412A3B5C2D1"
}
```

Mencatat absensi berdasarkan UID kartu RFID. Wali kelas hanya bisa men-tap kartu siswa kelasnya sendiri.

**Rate limit:** 12 permintaan/menit per UID + 3000 permintaan/menit per IP.

**Validasi UID:**
- Wajib diisi
- 8-24 karakter hexadecimal (0-9, A-F)
- Auto di-uppercase

**Response 200 (Berhasil):**
```json
{
  "success": true,
  "message": "Absensi berhasil",
  "student": { "name": "AGUNG WIBOWO", "class": "XI RPL 5", "nis": "25019203" },
  "status": "Tepat Waktu",
  "time": "06:45:00"
}
```

Status yang mungkin: `Tepat Waktu`, `Terlambat` (otomatis berdasarkan jam tap), atau `Alpha`, `Izin`, `Sakit`, `Dispen` (diatur manual oleh admin).

**Response 409 (Duplikat - sudah absen hari ini):**
```json
{
  "success": false,
  "is_duplicate": true,
  "message": "Sudah absen hari ini",
  "student": { "name": "...", "class": "...", "nis": "..." },
  "status": "Tepat Waktu",
  "time": "06:45:00"
}
```

**Response 403 (Kartu bukan kelas wali):**
```json
{ "success": false, "message": "Kartu ini bukan milik kelas Anda" }
```

**Response 404 (Kartu tidak dikenal):**
```json
{ "success": false, "message": "Kartu tidak terdaftar" }
```

**Response 400 (Validasi gagal):**
```json
{ "success": false, "message": "Format UID tidak valid (8-24 karakter hex)" }
```

---

### 4. Daftar Absensi Hari Ini

```
GET /api/attendance/today?limit=100&offset=0
```

Mendapatkan daftar absensi hari ini dengan pagination. Respons juga menyertakan **`stats`** rekap hari ini (dipakai metric bar di dashboard). Wali kelas otomatis di-scope ke kelasnya sendiri.

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| limit | number (1-200) | 100 | Jumlah data per halaman |
| offset | number (>=0) | 0 | Offset data |
| class | string | - | Filter kelas (admin saja; wali kelas selalu dikunci ke kelasnya) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 66,
      "date": "2026-08-13",
      "time": "06:45:00",
      "status": "Tepat Waktu",
      "student_name": "AGUNG WIBOWO",
      "student_class": "XI RPL 5",
      "student_nis": "25019203"
    }
  ],
  "total": 5,
  "stats": {
    "total_students": 32,
    "present": 5,
    "on_time": 4,
    "late": 1,
    "absent": 27
  }
}
```

Field `stats`:
| Field | Keterangan |
|-------|------------|
| `total_students` | Jumlah siswa aktif |
| `present` | Total absen hari ini |
| `on_time` | Absen Tepat Waktu |
| `late` | Absen Terlambat |
| `absent` | Siswa belum absen (`total_students - present`) |

---

### 5. Pemantauan Kehadiran Siswa

```
GET /api/attendance/status?limit=20&offset=0&q=
```

Status seluruh siswa (aktif) hari ini: **Belum Absen / Tepat Waktu / Terlambat**, dengan pagination dan pencarian. Endpoint ini dipakai section **Pemantauan Kehadiran** di dashboard admin.

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| limit | number (1-200) | 20 | Jumlah data per halaman |
| offset | number (>=0) | 0 | Offset data |
| class | string | - | Filter kelas |
| q | string (max 50) | - | Cari NIS / nama / kelas |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 66,
      "nis": "25019203",
      "name": "AGUNG WIBOWO",
      "class": "XI RPL 5",
      "time": "06:45:00",
      "status": "Tepat Waktu",
      "attendanceId": 1,
      "keterangan": null
    }
  ],
  "total": 32,
  "stats": { "total_students": 32, "present": 5, "on_time": 4, "late": 1, "absent": 27 }
}
```

Field tambahan:
| Field | Keterangan |
|-------|------------|
| `attendanceId` | ID record absensi (null jika belum absen) |
| `keterangan` | Catatan opsional (null jika tidak ada) |

---

### 6. SSE Stream (Real-time)

```
GET /api/attendance/stream
```

Koneksi Server-Sent Events untuk menerima notifikasi real-time ketika ada absensi baru. Event di-filter per kelas (wali kelas hanya menerima event kelasnya).

**Event: `attendance:new`**
Dikirim ketika ada absensi berhasil.
```json
{
  "name": "AGUNG WIBOWO",
  "class": "XI RPL 5",
  "nis": "25019203",
  "student_id": 66,
  "time": "06:45:00",
  "status": "Tepat Waktu"
}
```

**Event: `attendance:duplicate`**
Dikirim ketika ada percobaan absensi duplikat.

**Spesifikasi Koneksi:**
- Max 100 client bersamaan (lewat batas → 503)
- Heartbeat (komentar) setiap 30 detik
- Client dianggap mati setelah 90 detik tidak ada aktivitas
- Auto-reconnect di client **tanpa batas** dengan backoff 1s→2s→4s→... capped di 30 detik

---

### 7. Ubah Status Absensi (PUT, Admin)

```
PUT /api/attendance/:id/status
Content-Type: application/json

{
  "status": "Izin",
  "keterangan": "Izin keluarga"
}
```

Mengubah status absensi siswa yang sudah ada. Hanya admin.

**Rate limit:** 60 permintaan/menit per IP.

**Validasi:**
- `status`: wajib, salah satu dari `Tepat Waktu`, `Terlambat`, `Alpha`, `Izin`, `Sakit`, `Dispen`
- `keterangan`: opsional, maksimal 255 karakter

**Response 200:**
```json
{
  "success": true,
  "message": "Status berhasil diperbarui"
}
```

**Response 400:** `{ "success": false, "message": "ID tidak valid" }`
**Response 404:** `{ "success": false, "message": "Data absensi tidak ditemukan" }`

---

### 8. Atur Status Manual (POST, Admin)

```
POST /api/attendance/manual
Content-Type: application/json

{
  "student_id": 66,
  "status": "Sakit",
  "keterangan": "Sakit flu"
}
```

Membuat atau meng-update absensi manual untuk siswa yang belum/telah absen hari ini. Jika sudah ada record absensi, status akan di-update. Jika belum ada, record baru akan dibuat. Hanya admin.

**Rate limit:** 60 permintaan/menit per IP.

**Validasi:**
- `student_id`: wajib, integer positif
- `status`: wajib, salah satu dari `Tepat Waktu`, `Terlambat`, `Alpha`, `Izin`, `Sakit`, `Dispen`
- `keterangan`: opsional, maksimal 255 karakter

**Response 200:**
```json
{
  "success": true,
  "message": "Status berhasil diatur"
}
```

**Response 404:** `{ "success": false, "message": "Siswa tidak ditemukan" }`

---

### 9. Registrasi Kartu (POST)

```
POST /api/cards
Content-Type: application/json

{
  "uid": "0412A3B5C2D1",
  "student_id": 1
}
```

Mendaftarkan kartu RFID baru ke siswa tertentu (admin saja).

**Rate limit:** 60 permintaan/menit per IP.

**Validasi:**
- `uid`: wajib, 8-24 karakter hex, auto-uppercase
- `student_id`: wajib, integer positif

**Response 200 (Berhasil):**
```json
{
  "success": true,
  "message": "Kartu berhasil didaftarkan",
  "student": { "name": "AGUNG WIBOWO", "class": "XI RPL 5", "nis": "25019203" }
}
```

**Response 404:** `{ "success": false, "message": "Siswa tidak ditemukan" }`
**Response 409:** `{ "success": false, "message": "UID kartu sudah terdaftar" }`

---

### 10. Daftar Kartu Terbaru (GET)

```
GET /api/cards?limit=20&offset=0
```

Mendapatkan daftar kartu terdaftar (urut dari terbaru) dengan pagination.

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| limit | number (1-100) | 20 | Jumlah data per halaman |
| offset | number (>=0) | 0 | Offset data |
| class | string | - | Filter kelas |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uid": "0412A3B5C2D1",
      "is_active": true,
      "student_name": "AGUNG WIBOWO",
      "student_class": "XI RPL 5",
      "student_nis": "25019203",
      "created_at": "2026-08-13 23:33:34"
    }
  ],
  "total": 12
}
```

`created_at` diformat sesuai timezone aplikasi (`YYYY-MM-DD HH:mm:ss`).

---

### 11. Daftar Siswa (GET, Pagination)

```
GET /api/students?limit=20&offset=0&q=
```

Mendapatkan daftar siswa (urut dari terbaru) dengan pagination dan pencarian.

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| limit | number (1-100) | 20 | Jumlah data per halaman |
| offset | number (>=0) | 0 | Offset data |
| q | string (max 50) | - | Cari NIS / nama / kelas |
| class | string | - | Filter kelas |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nis": "25019203",
      "name": "AGUNG WIBOWO",
      "class": "XI RPL 5",
      "is_active": true,
      "created_at": "2026-08-13 23:33:34"
    }
  ],
  "total": 12
}
```

---

### 12. Registrasi Siswa (POST)

```
POST /api/students
Content-Type: application/json

{
  "nis": "25019203",
  "name": "AGUNG WIBOWO",
  "class": "XI RPL 5"
}
```

Mendaftarkan siswa baru (admin saja).

**Rate limit:** 60 permintaan/menit per IP.

**Validasi:**
- `nis`: wajib, maksimal 20 karakter (unique — duplikat ditolak)
- `name`: wajib, maksimal 100 karakter
- `class`: wajib, maksimal 20 karakter (di-normalisasi ke huruf kapital)

**Response 200:**
```json
{
  "success": true,
  "message": "Siswa berhasil didaftarkan",
  "student": { "nis": "25019203", "name": "AGUNG WIBOWO", "class": "XI RPL 5" }
}
```

**Response 409:** `{ "success": false, "message": "NIS sudah terdaftar" }`

---

### 13. Update / Hapus Siswa

```
PUT /api/students/:id
Content-Type: application/json

{
  "nis": "25019203",
  "name": "AGUNG WIBOWO",
  "class": "XII RPL 5"
}
```

```
DELETE /api/students/:id
```

**Response 404:** `{ "success": false, "message": "Siswa tidak ditemukan" }`
**Response 409 (hapus):** `{ "success": false, "message": "Siswa memiliki data kartu atau absensi dan tidak dapat dihapus" }`

---

### 14. Import Siswa Massal (POST)

```
POST /api/students/import
Content-Type: application/json

{
  "lines": "2024001;Budi Santoso;XII RPL 1\n2024002;Siti Aminah;XII RPL 1"
}
```

Import banyak siswa sekaligus (admin saja). Format satu siswa per baris: `NIS;Nama;Kelas`. Baris yang NIS-nya sudah terdaftar otomatis dilewati (`skipped`).

> **Catatan:** Endpoint API ini masih tersedia untuk integrasi/script, tetapi UI import telah dihapus dari dashboard admin.

**Batasan:** maksimal 500 baris per impor.

**Response 200:**
```json
{
  "success": true,
  "message": "Impor selesai",
  "added": 2,
  "skipped": 1,
  "errors": ["Baris 3: NIS duplikat dalam file (2024001)"]
}
```

---

### 15. Riwayat Absensi Siswa (GET)

```
GET /api/students/:id/attendance?days=30
```

Mendapatkan riwayat absensi seorang siswa (30 hari terakhir secara default).

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| days | number (1-100) | 30 | Jumlah hari riwayat yang diambil |

**Response 200:**
```json
{
  "success": true,
  "message": "Riwayat absensi dimuat",
  "student": { "id": 1, "nis": "25019203", "name": "AGUNG WIBOWO", "class": "XI RPL 5" },
  "history": [
    { "id": 10, "student_id": 1, "date": "2026-08-13", "time": "06:45:00", "status": "Tepat Waktu" }
  ]
}
```

---

### 16. Daftar Siswa Aktif (GET)

```
GET /api/students/active
```

Mendapatkan daftar siswa aktif untuk dropdown registrasi kartu (di-scope per kelas untuk wali).

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "nis": "25019203", "name": "AGUNG WIBOWO", "class": "XI RPL 5" }
  ]
}
```

### 17. Daftar Kelas Siswa (GET)

```
GET /api/students/classes
```

Daftar kelas yang memiliki siswa aktif (admin saja), dipakai dropdown filter.

**Response 200:**
```json
{
  "success": true,
  "data": ["XI RPL 5", "XII RPL 1"]
}
```

---

### 18. Kelola Kelas & Akun Wali (Admin)

Semua endpoint di bawah memerlukan peran admin.

#### Daftar Kelas

```
GET /api/admin/classes
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "class": "XII RPL 1", "student_count": 0, "account": { "username": "xii.rpl.1", "createdAt": "2026-08-13 23:33:34" } }
  ]
}
```

#### Buat Kelas + Akun Wali

```
POST /api/admin/classes
Content-Type: application/json

{ "class": "XII RPL 6" }
```

Membuat akun wali kelas dengan username otomatis (contoh `xii.rpl.6`) dan password default.

**Response 200:**
```json
{
  "success": true,
  "message": "Kelas XII RPL 6 dibuat beserta akun wali \"xii.rpl.6\"",
  "class": "XII RPL 6",
  "username": "xii.rpl.6",
  "default_password": "ganti123"
}
```

**Response 409:** `{ "success": false, "message": "Akun wali untuk kelas XII RPL 6 sudah ada (\"xii.rpl.6\")" }`

#### Reset Password Akun Wali

```
POST /api/admin/classes/reset-password
Content-Type: application/json

{ "class": "XII RPL 6" }
```

Mereset password akun wali ke password default.

#### Hapus Akun Wali

```
POST /api/admin/classes/remove-account
Content-Type: application/json

{ "class": "XII RPL 6" }
```

Menghapus akun wali kelas (data siswa tetap ada).

---

### 19. Halaman Web

```
GET /login               → Halaman login
GET /                    → Dashboard admin (absensi + pemantauan + kelas)
GET /kelas/:namaKelas    → Dashboard wali kelas (absensi kelasnya)
GET /register            → Halaman registrasi kartu (admin)
GET /students            → Halaman manajemen siswa (admin)
```

Semua halaman (kecuali `/login`) mewajibkan login; yang tidak login diarahkan ke `/login`. Non-admin yang mencoba halaman admin diarahkan ke halaman kelasnya sendiri. Wali kelas yang membuka kelas lain mendapat `403`.

---

## Rate Limiting

Semua limiter memakai window 60 detik dan merespons `429` JSON.

| Endpoint | Limiter | Limit | Key |
|----------|---------|-------|-----|
| `POST /api/auth/login` | `loginUserLimiter` | 5/menit | username (lowercase) |
| `POST /api/auth/login` | `loginIpLimiter` | 20/menit | IP |
| `POST /api/attendance` | `attendanceUidLimiter` | 12/menit | UID (fallback IP) |
| `POST /api/attendance` | `attendanceIpLimiter` | 3000/menit | IP |
| `POST /api/cards` | `writeIpLimiter` | 60/menit | IP |
| `POST /api/students`, `PUT`/`DELETE /api/students/:id`, `POST /api/students/import` | `writeIpLimiter` | 60/menit | IP |
| `PUT /api/attendance/:id/status`, `POST /api/attendance/manual` | `writeIpLimiter` | 60/menit | IP |
| `POST /api/admin/classes` dan turunannya | `writeIpLimiter` | 60/menit | IP |
| `GET` baca (`/api/attendance/today`, `/status`, `/api/cards`, `/api/students`, dst.) | `readIpLimiter` | 120/menit | IP |
| `GET /api/attendance/stream` (SSE) | `sseIpLimiter` | 100/menit | IP |

Header `RateLimit-*` dikirim (standard `draft-8`).

> Catatan:
> - Key generator memakai `ipKeyGenerator()` dari express-rate-limit untuk kompatibilitas IPv6.
> - Semua limiter menghitung **semua** request (sukses maupun gagal). `writeIpLimiter` khususnya tidak lagi memakai `skipSuccessfulRequests` — request tulis yang sukses ikut dihitung ke kuota 60/menit/IP.
> - `readIpLimiter` dan `sseIpLimiter` dipasang pada endpoint baca agar beban dari refresh/pagination/script tidak membebani database; batasnya sengaja longgar agar tidak mengganggu penggunaan normal dashboard.

---

## Penanganan Error

Error handling terpusat di `src/middleware/errorHandler.ts` yang **menelusuri rantai `cause`** (penting: Drizzle ORM 0.45 membungkus error database ke dalam `DrizzleQueryError`, sehingga kode MySQL seperti `ER_DUP_ENTRY` ada di `cause`, bukan di level atas).

| Kondisi | Status | Pesan |
|---------|--------|-------|
| `ER_DUP_ENTRY` (duplikat NIS / absensi) | 409 | `Data sudah ada dalam sistem` |
| `ER_ROW_IS_REFERENCED_2` / `ER_ROW_IS_REFERENCED` (FK RESTRICT) | 409 | `Siswa memiliki data kartu atau absensi dan tidak dapat dihapus` |
| `ECONNREFUSED`, `PROTOCOL_CONNECTION_LOST`, `ENOTFOUND`, `POOL_ENQUEUELIMIT`, `ECONNRESET` | 503 | `Database tidak dapat dihubungi` |
| Error database lain (`ER_*`) | 500 | `Terjadi kesalahan pada database` |
| Error lain (dengan `statusCode`) | sesuai | `Terjadi kesalahan pada server` |
| ID absensi tidak valid (PUT /status) | 400 | `ID tidak valid` |
| Record absensi tidak ditemukan (PUT /status) | 404 | `Data absensi tidak ditemukan` |
| Siswa tidak ditemukan (POST /manual) | 404 | `Siswa tidak ditemukan` |

Setiap error menyertakan `errorId` unik untuk memudahkan pencocokan dengan log server.

**Duplikasi absensi** juga di-handle di service layer (`isDuplicateEntryError`) untuk menangani race condition dua tap bersamaan pada siswa yang sama — query pre-check & race handler dipusatkan pada satu helper (`findDuplicate`) agar logika konsisten.

**Integritas referensi** dijaga oleh FK RESTRICT di schema: siswa dengan kartu/absensi tidak bisa dihapus (ditangkap service sebagai `isForeignKeyError` → 409), dan duplikat NIS diblokir unique index `uq_students_nis`.

**Connection pool** (`src/db/pool.ts`): `connectionLimit: 10`, `queueLimit: 100`, keep-alive aktif. Antrian penuh → `POOL_ENQUEUELIMIT` → 503 (mencegah request menggantung saat DB penuh).

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
npm run db:push
mysql -u root -p rfid_attendance < database/seed.sql
npm run seed:users

# Konfigurasi environment (edit .env)
# PORT=3000
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=rfid_attendance
# LATE_THRESHOLD=07:00:00
# APP_TIMEZONE=Asia/Jakarta
# CORS_ORIGIN=http://localhost:4321
# SESSION_SECRET=change-me
# CLASS_DEFAULT_PASSWORD=ganti123
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

### 3. Akun Default

`npm run seed:users` membuat akun berikut (password default: `ganti123`):

| Username | Peran | Keterangan |
|----------|-------|------------|
| `admin` | Admin | Akses semua halaman & semua kelas |
| `xii.rpl.1` | Wali kelas | Hanya kelas XII RPL 1 |
| `xii.rpl.2` | Wali kelas | Hanya kelas XII RPL 2 |
| ... | ... | hingga `xii.rpl.5` |

> **PENTING:** Segera ganti password default setelah login pertama (via menu **Ganti Password** / `POST /api/auth/change-password`). Reset password akun wali lewat dashboard admin atau `npm run seed:users -- --reset-password <username>`.

### 4. Testing API

```bash
# Health check
curl http://localhost:3000/api/health

# Login → simpan cookie sesi
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ganti123"}'

# Daftar siswa aktif → catat id yang dipakai (mis. id 66)
curl -b cookies.txt "http://localhost:3000/api/students/active"

# Registrasi kartu untuk siswa id 66
curl -b cookies.txt -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"uid": "A1B2C3D4E5F6", "student_id": 66}'

# Absen dengan UID yang baru didaftarkan
curl -b cookies.txt -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"uid": "A1B2C3D4E5F6"}'

# Lihat daftar + stats hari ini
curl -b cookies.txt "http://localhost:3000/api/attendance/today?limit=10&offset=0"

# Pemantauan kehadiran siswa
curl -b cookies.txt "http://localhost:3000/api/attendance/status?limit=10&offset=0"

# Riwayat absensi siswa id 66
curl -b cookies.txt "http://localhost:3000/api/students/66/attendance?days=30"

# SSE stream (terminal terpisah)
curl -b cookies.txt -N http://localhost:3000/api/attendance/stream
```

### 5. Seed Data

`database/seed.sql` berisi siswa contoh (32 siswa kelas XI RPL 5). Tabel `cards` **tidak** di-seed — kartu RFID didaftarkan lewat halaman `/register` atau `POST /api/cards`. Akun pengguna dibuat via `npm run seed:users`.

> **Catatan:** `test-curl.sh` memakai UID tetap (mis. `A1B2C3D4E5F6`) yang akan tersimpan sebagai data asli di tabel `cards`. Hapus baris tersebut jika tidak diinginkan di data produksi.

---

## Scripts

| Perintah | Keterangan |
|----------|------------|
| `npm run dev` | Jalankan dev server dengan hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm start` | Jalankan production (`node dist/index.js`) |
| `npm run db:generate` | Generate migrasi Drizzle |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run db:push` | Sinkronkan schema ke database |
| `npm run seed:users` | Seed akun admin + wali kelas (`--reset-password <username>` untuk reset) |
| `npm run stress` | Stress test absensi (lihat `scripts/stress-test.mjs --help`) |

---

## Alur Kerja Sistem

### Alur Login

```
1. User membuka /login, memasukkan username & password
2. Server verifikasi (scrypt), buat token sesi (HMAC), set cookie sid (12 jam)
3. Setiap request berikutnya divalidasi cookie (requireAuth)
4. Peran ditentukan dari class: NULL = admin, lainnya = wali kelas
5. Wali kelas di-scope ke kelasnya (API + halaman + SSE)
```

### Alur Absensi (Tap RFID)

```
1. Kartu RFID ditempelkan ke reader
2. Reader mengirim UID ke server via POST /api/attendance
3. Rate limit dicek (12/menit per UID, 3000/menit per IP)
4. Server validasi format UID (Zod)
5. Server cari kartu aktif dengan UID tersebut (JOIN cards + students)
   ├── Jika tidak ditemukan → 404 "Kartu tidak terdaftar"
   └── Jika ditemukan:
       ├── Wali kelas? Pastikan kartu milik kelasnya → 403 jika bukan
       ├── Cek apakah sudah absen hari ini (UNIQUE constraint)
       │   ├── Jika sudah → 409 "Sudah absen hari ini" + SSE event attendance:duplicate
       │   └── Jika belum:
       │       ├── Tentukan status (Tepat Waktu / Terlambat)
       │       ├── Insert ke database (kolom status + keterangan)
       │       │   ├── Jika ER_DUP_ENTRY (race condition) → handle graciously
       │       │   └── Jika sukses:
       │       │       ├── Broadcast via SSE ke client kelas terkait
       │       │       └── Response 200 ke reader
       │       └── (Error lain → throw, tangani di errorHandler)
```

**Status yang mungkin:**
- `Tepat Waktu` / `Terlambat` — ditentukan otomatis berdasarkan jam tap
- `Alpha` / `Izin` / `Sakit` / `Dispen` — diatur manual oleh admin dari dashboard

### Alur Real-time (SSE)

```
1. Client browser connect ke GET /api/attendance/stream
2. Server registrasi client (termasuk scope kelas wali), kirim heartbeat tiap 30 detik
3. Ketika ada absensi baru, server broadcast event ke client yang sesuai kelasnya
4. Client JS menerima event, update UI (metric bar + toast + tabel)
5. Jika koneksi putus, client auto-reconnect tanpa batas dengan backoff
   (1s, 2s, 4s, 8s, ... max 30s)
```

### Penentuan Status

```
Otomatis (tap RFID):
  current_time <= late_threshold → "Tepat Waktu"
  current_time >  late_threshold → "Terlambat"

Manual (admin via dashboard):
  Alpha / Izin / Sakit / Dispen (dengan keterangan opsional)
```

- **Status otomatis** ditentukan saat siswa tap kartu RFID, berdasarkan `late_threshold`
- **Status manual** diatur oleh admin dari kolom Aksi di tabel pemantauan:
  - Siswa yang **belum absen** → admin bisa atur status: Tepat Waktu, Terlambat, Alpha, Izin, Sakit, Dispen
  - Siswa yang **sudah absen** → admin bisa mengubah status yang sudah ada (misal dari Tepat Waktu ke Izin)
- Kolom `keterangan` menyimpan catatan opsional (misalnya "Sakit flu" atau "Izin keluarga")
- Status manual disimpan ke tabel `attendance` (sama dengan status otomatis)
- **Badge warna** untuk setiap status di UI:
  - Tepat Waktu → hijau, Terlambat → merah, Belum Absen → abu-abu
  - Alpha → abu-abu gelap, Izin → kuning, Sakit → biru, Dispen → indigo

### Alur Status Manual (Admin)

```
1. Admin membuka dashboard (/) dan melihat tabel Pemantauan Kehadiran
2. Untuk siswa yang belum absen:
   a. Pilih status dari dropdown (Atur Status)
   b. Isi keterangan (opsional)
   c. Klik "Simpan"
   d. POST /api/attendance/manual → insert record absensi baru
3. Untuk siswa yang sudah absen:
   a. Ubah status dari dropdown yang sudah terisi
   b. Edit keterangan (opsional)
   c. Klik "Simpan"
   d. PUT /api/attendance/:id/status → update record absensi
4. Perubahan di-broadcast via SSE ke client lain
```

- `late_threshold` bisa dikonfigurasi via environment variable `LATE_THRESHOLD` (default: `07:00:00`)
- Bisa juga diset per-instansi via tabel `settings` key `late_threshold` (lebih prioritas dari env)
- Nilai dari database di-cache in-memory selama 10 detik untuk mengurangi beban query

### Waktu (Timezone)

Semua perhitungan tanggal/jam absensi memakai `Intl.DateTimeFormat` dengan timezone `APP_TIMEZONE` (default `Asia/Jakarta`) — tidak bergantung pada timezone OS/server.

---

## Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port server |
| `NODE_ENV` | `development` | Environment mode (`development`/`production`/`test`) |
| `CORS_ORIGIN` | `http://localhost:4321` | Origin CORS |
| `DB_HOST` | `localhost` | Host database |
| `DB_PORT` | `3306` | Port database |
| `DB_USER` | `root` | User database |
| `DB_PASSWORD` | (kosong) | Password database (wajib di production) |
| `DB_NAME` | `rfid_attendance` | Nama database |
| `LATE_THRESHOLD` | `07:00:00` | Batas jam keterlambatan (format HH:MM:SS) |
| `APP_TIMEZONE` | `Asia/Jakarta` | Zona waktu IANA untuk tanggal/jam absensi |
| `TRUST_PROXY` | `false` | Aktifkan jika di belakang proxy (agar rate limit pakai IP asli) |
| `SESSION_SECRET` | dev default | Secret HMAC untuk tanda tangan cookie sesi (wajib diganti di production) |
| `CLASS_DEFAULT_PASSWORD` | `ganti123` | Password default akun wali yang dibuat via admin |

Di mode `production`, variabel wajib (`CORS_ORIGIN`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`) harus diisi — aplikasi akan menolak start dengan pesan error yang jelas jika kosong.

---
