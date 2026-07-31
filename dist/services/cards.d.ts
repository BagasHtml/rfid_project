import type { RegisterCardResult } from '../types/index.js';
export declare function registerCard(uid: string, studentId: number): Promise<RegisterCardResult>;
export declare function listRecent(limit?: number): Promise<import("../types/index.js").CardRecord[]>;
