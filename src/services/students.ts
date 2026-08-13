import * as studentRepo from '../repositories/student.js';
import * as attendanceRepo from '../repositories/attendance.js';
import { toStudentRecord } from '../mappers/student.js';
import { toAttendanceRecord } from '../mappers/attendance.js';
import { writeOrDuplicate } from '../utils/insert.js';
import { isForeignKeyError } from '../utils/error.js';
import { normalizeClassName } from '../utils/format.js';
import { ok, fail } from '../utils/http.js';
import type { RegisterStudentResult } from '../types/student.js';

const IMPORT_LIMIT = 500;

interface ParsedStudentLine {
  nis: string;
  name: string;
  class: string;
}

function parseImportLines(rawLines: string[]): { parsed: ParsedStudentLine[]; errors: string[] } {
  const parsed: ParsedStudentLine[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  rawLines.forEach((line, index) => {
    const [nis, name, className] = line.split(';').map(part => part.trim());

    if (!nis || !name || !className) {
      errors.push(`Baris ${index + 1}: format harus "NIS;Nama;Kelas"`);
      return;
    }

    const nisKey = nis.toLowerCase();
    if (seen.has(nisKey)) {
      errors.push(`Baris ${index + 1}: NIS duplikat dalam file (${nis})`);
      return;
    }
    seen.add(nisKey);
    parsed.push({ nis, name, class: normalizeClassName(className) });
  });

  return { parsed, errors };
}

export async function createStudent(nis: string, name: string, className: string): Promise<RegisterStudentResult> {
  const normalizedClass = normalizeClassName(className);
  const conflict = await writeOrDuplicate(
    () => studentRepo.insertStudent(nis, name, normalizedClass),
    () => fail('NIS sudah terdaftar', 409),
  );
  if (conflict) return conflict;

  return ok('Siswa berhasil didaftarkan', { student: { nis, name, class: normalizedClass } });
}

export async function updateStudent(id: number, nis: string, name: string, className: string): Promise<RegisterStudentResult> {
  const existing = await studentRepo.findById(id);

  if (!existing) return fail('Siswa tidak ditemukan', 404);

  const normalizedClass = normalizeClassName(className);
  const conflict = await writeOrDuplicate(
    () => studentRepo.updateStudent(id, { nis, name, class: normalizedClass }),
    () => fail('NIS sudah terdaftar', 409),
  );
  if (conflict) return conflict;

  return ok('Siswa berhasil diperbarui', { student: { nis, name, class: normalizedClass } });
}

export async function deleteStudent(id: number): Promise<{ success: boolean; message: string; statusCode: number }> {
  try {
    const deleted = await studentRepo.deleteStudent(id);

    if (deleted === 0) return fail('Siswa tidak ditemukan', 404);
  } catch (err) {
    if (isForeignKeyError(err)) {
      return fail('Siswa memiliki data kartu atau absensi dan tidak dapat dihapus', 409);
    }
    throw err;
  }

  return ok('Siswa berhasil dihapus');
}

export async function listClasses(): Promise<string[]> {
  return studentRepo.listClasses();
}

export async function listActive(className?: string) {
  return studentRepo.listActive(className);
}

export async function listStudents(limit?: number, offset?: number, search?: string, className?: string) {
  const { data, total } = await studentRepo.listStudents(limit, offset, search, className);
  return { data: data.map(toStudentRecord), total };
}

export interface ImportResult {
  success: boolean;
  message: string;
  statusCode: number;
  added?: number;
  skipped?: number;
  errors?: string[];
}

export async function importStudents(lines: string): Promise<ImportResult> {
  const rawLines = lines.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  if (rawLines.length === 0) return fail('Tidak ada data untuk diimpor', 400);

  if (rawLines.length > IMPORT_LIMIT) return fail(`Maksimal ${IMPORT_LIMIT} baris per impor`, 400);

  const { parsed, errors } = parseImportLines(rawLines);

  if (parsed.length === 0) return { ...fail('Tidak ada data valid untuk diimpor', 400), errors };

  const existing = await studentRepo.findByNisList(parsed.map(item => item.nis));
  const existingSet = new Set(existing.map(nis => nis.toLowerCase()));
  const toInsert = parsed.filter(item => !existingSet.has(item.nis.toLowerCase()));
  const skipped = parsed.length - toInsert.length;

  let added = 0;
  if (toInsert.length > 0) added = await studentRepo.insertStudentsBulk(toInsert);

  return ok('Impor selesai', { added, skipped, errors });
}

export interface StudentHistoryResult {
  success: boolean;
  message: string;
  statusCode: number;
  student?: { id: number; nis: string; name: string; class: string };
  history?: Array<{ date: string; time: string; status: string }>;
}

export async function getStudentHistory(
  id: number,
  limit: number = 30,
  userClass?: string | null,
): Promise<StudentHistoryResult> {
  const student = await studentRepo.findById(id);

  if (!student) return fail('Siswa tidak ditemukan', 404);

  if (userClass && student.class !== userClass) {
    return fail('Akses ditolak. Siswa bukan dari kelas Anda.', 403);
  }

  const rows = await attendanceRepo.getStudentHistory(id, limit);

  return ok('Riwayat absensi dimuat', {
    student: { id: student.id, nis: student.nis, name: student.name, class: student.class },
    history: rows.map(toAttendanceRecord),
  });
}
