import { z } from 'zod';

export const ClassNameSchema = z.object({
  class: z
    .string({ error: 'Nama kelas wajib diisi' })
    .trim()
    .min(1, 'Nama kelas wajib diisi')
    .max(20, 'Nama kelas maksimal 20 karakter'),
});

export type ClassNameInput = z.infer<typeof ClassNameSchema>;
