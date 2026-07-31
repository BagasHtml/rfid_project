import * as studentRepo from '../repositories/student.js';
export async function listActive() {
    return studentRepo.listActive();
}
