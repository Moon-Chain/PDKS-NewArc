import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError.js';

type SchemaFn = (body: Record<string, unknown>) => { error?: string };

export function validate(schema: SchemaFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema(req.body as Record<string, unknown>);
    if (result.error) return next(new AppError(result.error, 422));
    next();
  };
}

// Hazır şemalar
export const loginSchema: SchemaFn = (body) => {
  if (!body.personnelId || typeof body.personnelId !== 'string')
    return { error: 'personnelId zorunludur' };
  if (!body.password || typeof body.password !== 'string')
    return { error: 'Şifre zorunludur' };
  if ((body.password as string).length < 4)
    return { error: 'Şifre en az 4 karakter olmalı' };
  return {};
};

export const changePasswordSchema: SchemaFn = (body) => {
  if (!body.currentPassword) return { error: 'Mevcut şifre zorunludur' };
  if (!body.newPassword) return { error: 'Yeni şifre zorunludur' };
  if ((body.newPassword as string).length < 4)
    return { error: 'Yeni şifre en az 4 karakter olmalı' };
  return {};
};
