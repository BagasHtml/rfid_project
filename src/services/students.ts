import * as studentRepo from '../repositories/student.js';
import { toStudentRecord } from '../mappers/student.js';
import { writeOrDuplicate } from '../utils/insert.js';
import { isForeignKeyError } from '../utils/error.js';
import type { RegisterStudentResult } from '../types/student.js';

export async function createStudent(nis: string, name: string, className: string): Promise<RegisterStudentResult> {
  const conflict = await writeOrDuplicate(
    () => studentRepo.insertStudent(nis, name, className),
    () => ({ success: false, message: 'NIS sudah terdaftar', statusCode: 409 }),
  );
  if (conflict) return conflict;

  return {
    success: true,
    message: 'Siswa berhasil didaftarkan',
    statusCode: 200,
    student: { nis, name, class: className },
  };
}

export async function updateStudent(id: number, nis: string, name: string, className: string): Promise<RegisterStudentResult> {
  const existing = await studentRepo.findById(id);

  if (!existing) {
    return { success: false, message: 'Siswa tidak ditemukan', statusCode: 404 };
  }

  const conflict = await writeOrDuplicate(
    () => studentRepo.updateStudent(id, { nis, name, class: className }),
    () => ({ success: false, message: 'NIS sudah terdaftar', statusCode: 409 }),
  );
  if (conflict) return conflict;

  return {
    success: true,
    message: 'Siswa berhasil diperbarui',
    statusCode: 200,
    student: { nis, name, class: className },
  };
}

export async function deleteStudent(id: number): Promise<{ success: boolean; message: string; statusCode: number }> {
  try {
    const deleted = await studentRepo.deleteStudent(id);

    if (deleted === 0) {
      return { success: false, message: 'Siswa tidak ditemukan', statusCode: 404 };
    }
  } catch (err) {
    if (isForeignKeyError(err)) {
      return {
        success: false,
        message: 'Siswa memiliki data kartu atau absensi dan tidak dapat dihapus',
        statusCode: 409,
      };
    }
    throw err;
  }

  return { success: true, message: 'Siswa berhasil dihapus', statusCode: 200 };
}

export async function listActive() {
  return studentRepo.listActive();
}

export async function listStudents(limit?: number, offset?: number, search?: string) {
  const { data, total } = await studentRepo.listStudents(limit, offset, search);
  return { data: data.map(toStudentRecord), total };
}
