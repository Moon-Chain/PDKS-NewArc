import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/roles.js';
import { notificationService } from '../../services/NotificationService.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

// GET /api/v1/notifications — liste + okunmamış sayısı
router.get('/', requirePermission('notification:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const result = await notificationService.list(companyId, userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/v1/notifications/count — sadece okunmamış sayısı
router.get('/count', requirePermission('notification:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const unread = await notificationService.getUnreadCount(companyId, userId);
    res.json({ success: true, unread });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read — tek bildirim oku
router.patch('/:id/read', requirePermission('notification:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await notificationService.markRead(companyId, userId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/notifications/read-all — tümünü oku
router.post('/read-all', requirePermission('notification:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await notificationService.markAllRead(companyId, userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/v1/notifications/:id — sil
router.delete('/:id', requirePermission('notification:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await notificationService.deleteNotification(companyId, userId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
