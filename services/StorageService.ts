import multer from 'multer';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = join(__dirname, '..', 'uploads');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const companyId = req.user?.company_id ?? 'unknown';
    const dir = join(UPLOADS_ROOT, companyId, 'avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG, WebP ve GIF yüklenebilir'));
  }
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('avatar');

export function avatarUrl(companyId: string, filename: string): string {
  return `/uploads/${companyId}/avatars/${filename}`;
}
