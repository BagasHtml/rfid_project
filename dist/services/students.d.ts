import * as studentRepo from '../repositories/student.js';
import type { RegisterStudentResult } from '../types/index.js';
export declare function createStudent(nis: string, name: string, className: string): Promise<RegisterStudentResult>;
export declare function listActive(): Promise<studentRepo.StudentListItem[]>;
export declare function listStudents(limit?: number, offset?: number): Promise<{
    data: import("../types/index.js").StudentRecord[];
    total: number;
}>;
