import * as studentRepo from '../repositories/student.js';
import { isDuplicateEntryError } from '../utils/error.js';
import type { RegisterStudentResult } from '../types/index.js';

export async function createStudent(nis: string, name: string, className: string): Promise<RegisterStudentResult> {
  try {
    await studentRepo.insertStudent(nis, name, className);
  } catch (err) {
    if (isDuplicateEntryError(err)) {
      return { success: false, message: 'NIS sudah terdaftar', statusCode: 409 };
    }
    throw err;
  }

  return {
    success: true,
    message: 'Siswa berhasil didaftarkan',
    statusCode: 200,
    student: { nis, name, class: className },
  };
}

export async function listActive() {
  return studentRepo.listActive();
}

export async function listStudents(limit?: number, offset?: number) {
  return studentRepo.listStudents(limit, offset);
}
