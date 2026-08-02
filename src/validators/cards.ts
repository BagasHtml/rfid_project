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
  limit: z.coerce.number({ error: 'Parameter limit harus berupa angka' })
    .int('Parameter limit harus bilangan bulat')
    .min(1, 'Parameter limit minimal 1')
    .max(100, 'Parameter limit maksimal 100')
    .default(20),
  offset: z.coerce.number({ error: 'Parameter offset harus berupa angka' })
    .int('Parameter offset harus bilangan bulat')
    .min(0, 'Parameter offset tidak boleh negatif')
    .default(0),
});

export type GetRecentCardsQueryInput = z.infer<typeof GetRecentCardsQuerySchema>;
