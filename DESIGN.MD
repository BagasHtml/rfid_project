# Design Documentation — AeuxGlobal Dashboard

## 1. Overview

Dashboard analitik lingkungan (environmental analytics) untuk workspace **EcoPlastic**. Fokus utama halaman ini adalah menampilkan metrik polusi udara, indeks kualitas lingkungan, investasi teknologi bersih, tren perubahan iklim, dan data daur ulang plastik per region.

- **Tema:** Dark sidebar + light content area, dengan aksen hijau (eco/sustainability branding)
- **Tipe layout:** Fixed sidebar + scrollable dashboard grid
- **Target:** Web app (desktop-first, responsive card grid)

---

## 2. Layout Structure

```
┌─────────────┬──────────────────────────────────────────────┐
│             │  Header: "Dashboard" + Add Custom Widget btn  │
│  Sidebar    ├──────────────────────────────────────────────┤
│  (fixed)    │  Row 1: 3 KPI Stat Cards                      │
│  - Logo     │  (Air Pollution | Env Quality Index | Invest) │
│  - Search   ├──────────────────────────────────────────────┤
│  - Nav menu │  Row 2: Climate Change Index (chart, 2 kolom) │
│  - Settings │          | Total Tons Reduced (1 kolom)       │
│  - Profile  ├──────────────────────────────────────────────┤
│             │  Row 3: Plastic Recycling Table (2 kolom)     │
│             │          | Global Pollution Map (1 kolom)     │
└─────────────┴──────────────────────────────────────────────┘
```

- **Grid:** 12-column responsive grid, gap 16–20px
- **Sidebar width:** ±220px, fixed
- **Card corner radius:** 16–20px (rounded-2xl)
- **Card padding:** 20–24px

---

## 3. Color Palette

| Token | Hex (approx) | Penggunaan |
|---|---|---|
| `--bg-app` | `#0B1F17` → gradient ke `#1A3A2A` | Background luar aplikasi (gradient hijau gelap) |
| `--bg-sidebar` | `#0E1512` | Sidebar dasar |
| `--bg-content` | `#F5F7F5` | Background area konten |
| `--bg-card` | `#FFFFFF` | Card default |
| `--bg-card-dark` | `#0F1D17` | Card highlight (mis. Air Pollution Level) |
| `--primary-green` | `#22C55E` | Aksen utama, grafik naik, tombol aktif |
| `--green-light` | `#86EFAC` | Bar chart sekunder |
| `--danger-red` | `#EF4444` | Indikator penurunan/negatif |
| `--text-primary` | `#0F172A` | Teks utama di light card |
| `--text-secondary` | `#64748B` | Label/subteks |
| `--text-on-dark` | `#FFFFFF` / `#E5E7EB` | Teks di card gelap & sidebar |
| `--border-subtle` | `#E5E7EB` | Divider antar baris tabel |

**Prinsip warna:** hijau = sinyal positif/eco, merah = sinyal negatif, sisanya netral (grayscale) agar data tetap jadi fokus visual utama.

---

## 4. Typography

| Elemen | Font-size | Weight | Contoh |
|---|---|---|---|
| Page title ("Dashboard") | 22–24px | Semibold/700 | Header halaman |
| Card big number ("35.05 µg/m³") | 28–32px | Bold/700 | KPI utama |
| Card label | 12–13px | Medium/500, uppercase-ish | "Air Pollution Level" |
| Body/table text | 13–14px | Regular/400–500 | Isi tabel region |
| Delta indicator (+2.3%) | 12px | Medium | Dengan ikon panah kecil |

Rekomendasi font: **Inter** atau **Plus Jakarta Sans** — netral, sangat mudah dibaca di ukuran kecil untuk dashboard data-dense, dan ringan di-load (bisa pakai `font-display: swap` via Google Fonts atau self-host subset variable font untuk performa terbaik).

---

## 5. Komponen Utama

### 5.1 Sidebar
- Logo brand + team workspace switcher ("EcoPlastic")
- Search bar dengan shortcut `⌘F`
- Navigation list: Dashboard (active), Analytics, Team Structure, Reports (badge notifikasi), Support (badge "NEW")
- Footer: Settings + User account card

### 5.2 KPI Stat Cards (Row 1)
3 kartu sejajar, masing-masing berisi:
- Label kecil
- Angka besar
- Indikator delta (naik/turun vs bulan lalu) dengan warna hijau/merah
- Mini bar chart di kanan (sparkline-style, 5–7 bar)

### 5.3 Climate Change Index (Chart Card)
- Bar chart historis (garis putus-putus target/rata-rata)
- Filter dropdown "2 month"
- Highlight satu bar (tooltip aktif menampilkan nilai "82.6 CCI")
- Sumbu X: minggu (W1–W8)

### 5.4 Total Tons Reduced (Side Card, dark)
- Angka besar "99,681m TONS"
- Sub-metric breakdown: Mechanical recycling & Chemical recycling, masing-masing dengan icon bulat + nilai

### 5.5 Plastic Recycling by Region (Table)
Kolom: Region (flag + nama), Factory, Recycled %, Dynamic (mini sparkline tren), Main Technologies (badge/tag berwarna), Total Value, action menu (⋮)

### 5.6 Global Pollution (Map Card)
- Peta choropleth (region Eropa) dengan gradasi warna hijau sesuai level polusi
- Filter dropdown region ("Europe")
- Tooltip highlight negara (mis. "Ukraine – High Level 89%")

---

## 6. Spacing & Elevation

- Base spacing unit: **4px** (gunakan skala 4/8/12/16/20/24)
- Card shadow: halus, `0 4px 16px rgba(0,0,0,0.06)` — hindari shadow berat karena background sudah gelap/gradient
- Radius konsisten: 12px (elemen kecil/badge), 16–20px (card besar), full-round (avatar, dot icon)

---

## 7. Rekomendasi Library Icon & Chart (Ringan & Efisien)

Karena dashboard ini padat komponen visual (icon navigasi, panah delta, bar chart, sparkline, choropleth map), pemilihan library berdampak besar ke bundle size. Berikut rekomendasi yang **ringan, tree-shakable, dan tidak membebani aset lain**:

### 7.1 Icon Library → **Lucide Icons** (`lucide-react`)
- Tree-shakable penuh — hanya icon yang di-*import* yang masuk ke bundle (tidak seperti icon font seperti Font Awesome yang me-load seluruh set)
- Format SVG murni, ringan (~1–2KB per icon), gampang di-style pakai `currentColor` sehingga otomatis ikut tema
- Set icon lengkap & konsisten untuk kebutuhan dashboard: `search`, `bell`, `settings`, `chevron-down`, `arrow-up-right`, `arrow-down-right`, `more-vertical`, dll.

```bash
npm install lucide-react
```
```jsx
import { ArrowUpRight, Search, Settings } from "lucide-react";
```

**Alternatif jika butuh gaya lebih playful:** `@phosphor-icons/react` (juga tree-shakable, tersedia banyak weight/style).

### 7.2 Chart Library → **Recharts**
- Dibangun di atas SVG + React, deklaratif, tidak butuh canvas library tambahan
- Cocok untuk semua chart di dashboard ini: bar chart (Climate Change Index), sparkline mini (KPI cards & kolom Dynamic), area/line chart
- Lebih ringan dan lebih mudah di-*customize* stylingnya (warna, tooltip, grid) dibanding Chart.js untuk kebutuhan React, dan tidak perlu load canvas renderer terpisah

```bash
npm install recharts
```
```jsx
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
```

**Untuk sparkline super kecil** (mini chart di stat card), gunakan komponen Recharts tanpa axis/grid (`<BarChart>` polos) — cukup ringan tanpa perlu library terpisah, sehingga tidak menambah dependency baru.

### 7.3 Peta Choropleth (Global Pollution)
- Gunakan **`react-simple-maps`** (berbasis D3-geo + SVG, ringan, tidak perlu load tile map raster seperti Leaflet/Mapbox yang jauh lebih berat untuk sekadar choropleth statis)
- Data GeoJSON region Eropa cukup diambil sekali dan di-cache secara statis

```bash
npm install react-simple-maps d3-scale
```

### 7.4 Ringkasan Perbandingan Bobot

| Kebutuhan | Direkomendasikan | Alasan ringan |
|---|---|---|
| Icon | `lucide-react` | SVG per-icon, tree-shakable |
| Bar/line/sparkline chart | `recharts` | SVG-based, tanpa canvas engine tambahan |
| Peta choropleth | `react-simple-maps` | SVG + GeoJSON statis, bukan tile-based map |
| ~~Alternatif yang dihindari~~ | ~~Font Awesome (full font), Chart.js+canvas, Leaflet/Mapbox~~ | Lebih berat untuk kasus pemakaian dashboard statis seperti ini |

---

## 8. Catatan Implementasi

- Gunakan **CSS variables** untuk semua warna di atas agar mudah support dark/light mode di masa depan.
- Sparkline di dalam tabel ("Dynamic" column) dan di KPI card sebaiknya pakai instance `ResponsiveContainer` dari Recharts yang di-*memo*-kan agar tidak re-render berlebihan saat tabel besar.
- Icon dari Lucide sebaiknya diimport satu-satu (named import), **jangan** `import * as Icons from "lucide-react"` agar tree-shaking tetap efektif.