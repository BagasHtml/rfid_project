import { z } from 'zod';
import { UID_PATTERN } from './attendance.js';
export const RegisterCardSchema = z.object({
    uid: z
        .string({ error: 'UID wajib diisi' })
        .trim()
        .toUpperCase()
        .regex(UID_PATTERN, 'Format UID tidak valid (8-24 karakter hex)'),
    student_id: z.coerce.number().int().positive('ID siswa tidak valid'),
});
export const GetRecentCardsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
