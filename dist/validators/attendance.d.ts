import { z } from 'zod';
export declare const UID_PATTERN: RegExp;
export declare const PostAttendanceSchema: z.ZodObject<{
    uid: z.ZodString;
}, z.core.$strip>;
export declare const GetTodayQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type PostAttendanceInput = z.infer<typeof PostAttendanceSchema>;
export type GetTodayQueryInput = z.infer<typeof GetTodayQuerySchema>;
