import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError.js';
import { db } from '../db/connection.js';

export interface JwtPayload {
  id: string;
  role: string;
  company_id: string;
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.pdks_token;
  if (!token) return next(new AppError('Oturum gerekli', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Token blacklist kontrolü (Redis yerine DB)
    const { rows } = await db.query(
      `SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()`,
      [decoded.jti]
    );
    if (rows.length > 0) return next(new AppError('Oturum sonlandırılmış', 401));

    req.user = decoded;
    next();
  } catch {
    next(new AppError('Oturum süresi dolmuş veya geçersiz', 401));
  }
}
