import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { notificationService } from '../../services/NotificationService.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/push/vapid-key — frontend subscribe için public key
router.get('/vapid-key', (req: Request, res: Response) => {
  const key = notificationService.getVapidPublicKey();
  res.json({ success: true, key });
});

// POST /api/v1/push/subscribe — subscription kaydet
router.post('/subscribe', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const { subscription } = req.body as { subscription: unknown };
    if (!subscription) {
      res.status(400).json({ error: 'Subscription gerekli' });
      return;
    }
    await notificationService.saveSubscription(userId, companyId, subscription);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/v1/push/subscribe — subscription kaldır
router.delete('/subscribe', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await notificationService.removeSubscription(userId, companyId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
