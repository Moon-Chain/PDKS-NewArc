import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError.js';

// Rol bazlı izin haritası — Kademe 2'de DB tabanlı RBAC ile değiştirilecek
const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set(['*']),
  mudur: new Set([
    'user:view', 'user:manage',
    'attendance:view', 'attendance:manage',
    'leave:view', 'leave:approve', 'leave:backdate',
    'overtime:view', 'overtime:approve',
    'settings:view',
    'notification:view',
  ]),
  takim_lideri: new Set([
    'user:view',
    'attendance:view',
    'leave:view', 'leave:approve',
    'overtime:view',
    'notification:view',
  ]),
  personel: new Set([
    'attendance:checkin',
    'leave:request',
    'overtime:request',
    'notification:view',
  ]),
};

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return next(new AppError('Oturum gerekli', 401));

    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return next(new AppError('Yetersiz yetki', 403));

    if (perms.has('*') || perms.has(permission)) return next();

    next(new AppError('Bu işlem için yetkiniz yok', 403));
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Oturum gerekli', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz yok', 403));
    }
    next();
  };
}
