import type { StudentRecord } from '../types/index.js';
export interface StudentListItem {
    id: number;
    nis: string;
    name: string;
    class: string;
}
export declare function listActive(): Promise<StudentListItem[]>;
export declare function findById(id: number): Promise<StudentListItem | null>;
export declare function insertStudent(nis: string, name: string, className: string): Promise<number>;
export declare function listStudents(limit?: number, offset?: number): Promise<{
    data: StudentRecord[];
    total: number;
}>;
