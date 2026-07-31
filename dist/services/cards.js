import * as cardRepo from '../repositories/card.js';
import * as studentRepo from '../repositories/student.js';
import { isDuplicateEntryError } from '../utils/error.js';
export async function registerCard(uid, studentId) {
    const existing = await cardRepo.findByUid(uid);
    if (existing) {
        return { success: false, message: 'UID kartu sudah terdaftar', statusCode: 409 };
    }
    const student = await studentRepo.findById(studentId);
    if (!student) {
        return { success: false, message: 'Siswa tidak ditemukan', statusCode: 404 };
    }
    try {
        await cardRepo.insertCard(uid, studentId);
    }
    catch (err) {
        if (isDuplicateEntryError(err)) {
            return { success: false, message: 'UID kartu sudah terdaftar', statusCode: 409 };
        }
        throw err;
    }
    return {
        success: true,
        message: 'Kartu berhasil didaftarkan',
        statusCode: 200,
        student: { name: student.name, class: student.class, nis: student.nis },
    };
}
export async function listRecent(limit) {
    return cardRepo.listRecent(limit);
}
