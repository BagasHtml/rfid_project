import type { CardWithStudent, CardRecord } from '../types/index.js';
export declare function findByUid(uid: string): Promise<{
    uid: string;
    student_id: number;
} | null>;
export declare function insertCard(uid: string, studentId: number): Promise<number>;
export declare function listRecent(limit?: number): Promise<CardRecord[]>;
export declare function findActiveByUid(uid: string): Promise<CardWithStudent | null>;
