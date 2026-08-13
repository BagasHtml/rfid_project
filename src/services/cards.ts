import * as cardRepo from '../repositories/card.js';
import * as studentRepo from '../repositories/student.js';
import { toCardRecord } from '../mappers/card.js';
import { writeOrDuplicate } from '../utils/insert.js';
import { ok, fail } from '../utils/http.js';
import type { RegisterCardResult } from '../types/card.js';

export async function registerCard(uid: string, studentId: number): Promise<RegisterCardResult> {
  const student = await studentRepo.findById(studentId);

  if (!student) return fail('Siswa tidak ditemukan', 404);

  const conflict = await writeOrDuplicate(
    () => cardRepo.insertCard(uid, studentId),
    () => fail('UID kartu sudah terdaftar', 409),
  );
  if (conflict) return conflict;

  return ok('Kartu berhasil didaftarkan', { student: { name: student.name, class: student.class, nis: student.nis } });
}

export async function listRecent(limit?: number, offset?: number, className?: string) {
  const { data, total } = await cardRepo.listRecent(limit, offset, className);
  return { data: data.map(toCardRecord), total };
}
