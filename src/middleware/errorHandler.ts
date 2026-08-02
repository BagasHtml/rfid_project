import { Request, Response, NextFunction } from 'express';
import { rootCause } from '../utils/error.js';

interface ErrorWithCode extends Error {
  code?: string;
  statusCode?: number;
}

function getCode(err: unknown): string | undefined {
  const root = rootCause(err);
  if (typeof root === 'object' && root !== null && 'code' in root) {
    return (root as { code?: string }).code;
  }
  return undefined;
}

export function errorHandler(
  err: ErrorWithCode,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  console.error(`[${errorId}] ${err.message}`);

  const connectionErrors = ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND', 'POOL_ENQUEUELIMIT', 'ECONNRESET'];

  const code = getCode(err);

  if (code && connectionErrors.includes(code)) {
    res.status(503).json({
      success: false,
      message: 'Database tidak dapat dihubungi',
      errorId,
    });
    return;
  }

  if (code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      message: 'Data sudah ada dalam sistem',
      errorId,
    });
    return;
  }

  if (code?.startsWith('ER_')) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada database',
      errorId,
    });
    return;
  }

  if (err.statusCode && err.statusCode < 500) {
    const type = (err as ErrorWithCode & { type?: string }).type;
    const message =
      type === 'entity.too.large'
        ? 'Data yang dikirim terlalu besar'
        : type === 'entity.parse.failed'
          ? 'Format data yang dikirim tidak valid'
          : err.message || 'Data tidak valid';

    res.status(err.statusCode).json({
      success: false,
      message,
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
