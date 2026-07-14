import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';

const SKIP_PREFIXES = ['/health', '/uploads', '/css', '/js', '/sw.js', '/manifest'];
const BODY_LIMIT    = 2000; // karakter

// Şifre içeren alanları maskele
function sanitizeBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const clone = { ...(body as Record<string, unknown>) };
  for (const key of ['password', 'password_hash', 'token', 'secret']) {
    if (key in clone) clone[key] = '***';
  }
  const str = JSON.stringify(clone);
  return str.length > BODY_LIMIT ? str.slice(0, BODY_LIMIT) + '…' : str;
}

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  // Sadece /api/ altındaki endpoint'leri logla, diğerlerini atla
  if (!req.path.startsWith('/api/')) return next();
  if (SKIP_PREFIXES.some((p) => req.path.startsWith(p))) return next();
  // SSE bağlantılarını atla — uzun süreli bağlantı, anlamsız log
  if (req.path.includes('/events') || req.headers.accept === 'text/event-stream') return next();

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const user     = (req as { user?: { id?: string; company_id?: string } }).user;

    db.query(
      `INSERT INTO api_logs
         (method, uri, query_params, body, response_code, duration_ms, ip_address, user_agent, company_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        req.method,
        req.path,
        Object.keys(req.query).length ? JSON.stringify(req.query) : null,
        sanitizeBody(req.body),
        res.statusCode,
        duration,
        req.ip ?? null,
        req.headers['user-agent']?.slice(0, 200) ?? null,
        user?.company_id ?? null,
        user?.id ?? null,
      ],
    ).catch(() => { /* log hatası uygulamayı etkilemesin */ });
  });

  next();
}
