import * as cardRepo from '../repositories/card.js';
import * as studentRepo from '../repositories/student.js';
import { toCardRecord } from '../mappers/card.js';
import { writeOrDuplicate } from '../utils/insert.js';
import type { RegisterCardResult } from '../types/card.js';

export async function registerCard(uid: string, studentId: number): Promise<RegisterCardResult> {
  const student = await studentRepo.findById(studentId);

  if (!student) {
    return { success: false, message: 'Siswa tidak ditemukan', statusCode: 404 };
  }

  const conflict = await writeOrDuplicate(
    () => cardRepo.insertCard(uid, studentId),
    () => ({ success: false, message: 'UID kartu sudah terdaftar', statusCode: 409 }),
  );
  if (conflict) return conflict;

  return {
    success: true,
    message: 'Kartu berhasil didaftarkan',
    statusCode: 200,
    student: { name: student.name, class: student.class, nis: student.nis },
  };
}

export async function listRecent(limit?: number, offset?: number) {
  const { data, total } = await cardRepo.listRecent(limit, offset);
  return { data: data.map(toCardRecord), total };
}
