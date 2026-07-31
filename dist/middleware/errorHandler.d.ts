import { Request, Response, NextFunction } from 'express';
interface ErrorWithCode extends Error {
    code?: string;
    statusCode?: number;
}
export declare function errorHandler(err: ErrorWithCode, _req: Request, res: Response, _next: NextFunction): void;
export {};
