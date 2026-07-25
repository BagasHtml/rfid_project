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
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  console.error(`[${errorId}] ${err.message}`);

  const connectionErrors = ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND'];

  if (connectionErrors.includes(err.code ?? '')) {
    res.status(503).json({
      success: false,
      message: 'Database tidak dapat dihubungi',
      errorId,
    });
    return;
  }

  if (err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      message: 'Data sudah ada dalam sistem',
      errorId,
    });
    return;
  }

  if (err.code?.startsWith('ER_')) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada database',
      errorId,
    });
    return;
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    errorId,
  });
}
