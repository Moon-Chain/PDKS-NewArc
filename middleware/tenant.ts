import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError.js';
import { db } from '../db/connection.js';
import type { Company } from '../shared/types/company.js';

declare global {
  namespace Express {
    interface Request {
      company?: Company;
    }
  }
}

export const requireTenant = resolveTenant;

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const companyId = req.user?.company_id;
  if (!companyId) return next(new AppError('Şirket bilgisi bulunamadı', 400));

  const { rows } = await db.query<Company>(
    `SELECT id, name, plan, is_active, max_users, slug, settings, created_at, updated_at
     FROM companies WHERE id = $1`,
    [companyId]
  );

  if (!rows[0]) return next(new AppError('Şirket bulunamadı', 404));
  if (!rows[0].is_active) return next(new AppError('Hesabınız askıya alınmış', 403));

  req.company = rows[0];
  next();
}
