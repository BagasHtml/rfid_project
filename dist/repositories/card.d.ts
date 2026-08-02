import type { CardWithStudent, CardRecord } from '../types/index.js';
export declare function insertCard(uid: string, studentId: number): Promise<number>;
export declare function listRecent(limit?: number, offset?: number): Promise<{
    data: CardRecord[];
    total: number;
}>;
export declare function findActiveByUid(uid: string): Promise<CardWithStudent | null>;
