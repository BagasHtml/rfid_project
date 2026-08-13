import { z } from 'zod';

export const LoginSchema = z.object({
  username: z
    .string({ error: 'Username wajib diisi' })
    .trim()
    .min(1, 'Username wajib diisi')
    .max(50, 'Username maksimal 50 karakter'),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(1, 'Password wajib diisi')
    .max(100, 'Password maksimal 100 karakter'),
});

export const ChangePasswordSchema = z.object({
  old_password: z
    .string({ error: 'Password lama wajib diisi' })
    .min(1, 'Password lama wajib diisi')
    .max(100, 'Password lama maksimal 100 karakter'),
  new_password: z
    .string({ error: 'Password baru wajib diisi' })
    .min(6, 'Password baru minimal 6 karakter')
    .max(100, 'Password baru maksimal 100 karakter'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
