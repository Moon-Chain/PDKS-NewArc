import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
