/**
 * Request logging. Lightweight — Vercel serverless has short lifetimes,
 * so no persistent log aggregation; this just gives pino-pretty output
 * in dev and JSON in prod (Vercel captures stdout).
 */
import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
        org: req.tenant?.orgId ?? '-',
      },
      'request',
    );
  });
  next();
}