import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/roles.js';
import { SettingsService } from '../../services/SettingsService.js';
import { SettingsRepository } from '../../repositories/SettingsRepository.js';
import type { Request, Response, NextFunction } from 'express';

const router  = Router();
const service = new SettingsService(new SettingsRepository());

router.use(requireAuth);

// GET /api/v1/settings
router.get('/', requirePermission('settings:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await service.get(req.user!.company_id);
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

// PATCH /api/v1/settings
router.patch('/', requirePermission('settings:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await service.update(req.user!.company_id, req.body);
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

// POST /api/v1/settings/generate-secret — yeni QR sırrı üret (kaydetmez)
router.post('/generate-secret', requirePermission('settings:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = service.generateSecret();
    res.json({ success: true, secret });
  } catch (err) { next(err); }
});

// POST /api/v1/settings/rotate-qr — QR sırrını üret ve DB'ye kaydet
router.post('/rotate-qr', requirePermission('settings:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = await service.rotateQrSecret(req.user!.company_id);
    res.json({ success: true, secret });
  } catch (err) { next(err); }
});

export default router;
