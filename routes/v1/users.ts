import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/roles.js';
import { UserService } from '../../services/UserService.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { avatarUpload, avatarUrl } from '../../services/StorageService.js';
import { AppError } from '../../core/AppError.js';
import type { Request, Response, NextFunction } from 'express';

const router  = Router();
const service = new UserService(new UserRepository());

router.use(requireAuth);

// GET /api/v1/users — personel listesi
router.get('/', requirePermission('user:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.company_id;
    const page    = Math.max(1, parseInt(req.query.page    as string) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 20));

    const result = await service.list(companyId, page, perPage);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id
router.get('/:id', requirePermission('user:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await service.get(req.user!.company_id, req.params.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// POST /api/v1/users — yeni personel
router.post('/', requirePermission('user:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await service.create(req.user!.company_id, req.body);
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/:id — güncelle (isteğe bağlı şifre sıfırlama dahil)
router.patch('/:id', requirePermission('user:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...rest } = req.body as Record<string, unknown>;

    // Şifre alanı doluysa sıfırla
    if (password && typeof password === 'string' && password.trim()) {
      await service.resetPassword(req.user!.company_id, req.params.id, password.trim());
    }

    const user = await service.update(req.user!.company_id, req.params.id, rest);
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/:id — pasife al (soft delete)
router.delete('/:id', requirePermission('user:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deactivate(req.user!.company_id, req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/users/:id/reset-password — şifre sıfırla (admin)
router.post('/:id/reset-password', requirePermission('user:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) throw new AppError('Yeni şifre zorunlu', 400);
    await service.resetPassword(req.user!.company_id, req.params.id, newPassword);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/users/:id/avatar — profil fotoğrafı yükle
router.post('/:id/avatar', async (req: Request, res: Response, next: NextFunction) => {
  const canEdit = req.user?.role === 'admin' || req.user?.role === 'mudur' || req.user?.id === req.params.id;
  if (!canEdit) return next(new AppError('Yetersiz yetki', 403));

  avatarUpload(req, res, async (err) => {
    if (err) return next(new AppError(err.message, 400));
    if (!req.file) return next(new AppError('Dosya yüklenmedi', 400));

    try {
      const url  = avatarUrl(req.user!.company_id, req.file.filename);
      const user = await service.updateAvatar(req.user!.company_id, req.params.id, url);
      res.json({ success: true, avatarPath: url, user });
    } catch (e) { next(e); }
  });
});

export default router;
