#!/bin/bash

# ============================================
# RFID Attendance API — curl Test Commands
# ============================================
# Jalankan backend dulu: npm run dev
# Default: http://localhost:3000

BASE_URL="http://localhost:3000"

echo "=== 1. Health Check ==="
curl -s "$BASE_URL/api/health" | jq .

echo ""
echo "=== 2. Absen — UID Valid (Pertama Kali) ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"04E5A0D3F7C1"}' | jq .
  curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"04C3F1A8B5D0"}' | jq .
  curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"0000000F51C5"}' | jq .
  curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"04E5A0D3F7C1"}' | jq .

echo ""
echo "=== 3. Absen — UID Sama (Duplikat, harus gagal) ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"0412A3B5C2D1"}' | jq .

echo ""
echo "=== 4. Absen — UID Berbeda (Mahasiswa Lain) ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"E5F6G7H8"}' | jq .

echo ""
echo "=== 5. Absen — UID Invalid (terlalu pendek) ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"ABC"}' | jq .

echo ""
echo "=== 6. Absen — UID Invalid ( karakter non-hex) ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"ZZZZZZZZ"}' | jq .

echo ""
echo "=== 7. Absen — Body Kosong ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo ""
echo "=== 8. Absen — UID Tidak Terdaftar ==="
curl -s -X POST "$BASE_URL/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"uid":"99999999"}' | jq .

echo ""
echo "=== 9. GET Today — Default (limit 100) ==="
curl -s "$BASE_URL/api/attendance/today" | jq .

echo ""
echo "=== 10. GET Today — Pagination (limit 2, offset 0) ==="
curl -s "$BASE_URL/api/attendance/today?limit=2&offset=0" | jq .

echo ""
echo "=== 11. GET Today — Limit Melebihi Max (harus di-cap 200) ==="
curl -s "$BASE_URL/api/attendance/today?limit=999" | jq .

echo ""
echo "=== 12. GET Today — Offset Negatif (harus diabaikan) ==="
curl -s "$BASE_URL/api/attendance/today?offset=-5" | jq .

echo ""
echo "=== 13. SSE Stream (tekan Ctrl+C untuk stop) ==="
echo "Running: curl -N $BASE_URL/api/attendance/stream"
echo "(Stream akan terus jalan, buka terminal lain untuk test POST)"
