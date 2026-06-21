import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/roles.js';
import { AuditRepository } from '../../../repositories/AuditRepository.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const repo   = new AuditRepository();

router.use(requireAuth);

// GET /api/v1/admin/audit — filtreli + sayfalı aktivite geçmişi
router.get('/', requirePermission('audit:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;
    const result = await repo.findPage({
      companyId,
      actor:  req.query.actor  as string | undefined,
      action: req.query.action as string | undefined,
      from:   req.query.from   as string | undefined,
      to:     req.query.to     as string | undefined,
      page:   parseInt(req.query.page  as string) || 1,
      limit:  parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

export default router;
