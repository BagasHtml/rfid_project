import { z } from 'zod';
export declare const RegisterCardSchema: z.ZodObject<{
    uid: z.ZodString;
    student_id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const GetRecentCardsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type GetRecentCardsQueryInput = z.infer<typeof GetRecentCardsQuerySchema>;
