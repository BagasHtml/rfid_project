import { Request, Response, NextFunction } from 'express';

interface ErrorWithCode extends Error {
  code?: string;
  statusCode?: number;
}

export function errorHandler(
  err: ErrorWithCode,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDatabaseError = err.code?.startsWith('ER_');
  const statusCode = err.statusCode || 500;
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.error(`[${errorId}] ${err.message}`);
  console.error(`[${errorId}] Stack: ${err.stack}`);

  if (isDatabaseError) {
    console.error(`[${errorId}] Database Error Code: ${err.code}`);
  }

  let message = 'Terjadi kesalahan pada server';

  if (isDatabaseError && err.code === 'ER_DUP_ENTRY') {
    message = 'Data sudah ada dalam sistem';
  } else if (isDatabaseError) {
    message = 'Terjadi kesalahan pada database';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorId,
  });
}
