import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/roles.js';
import { OvertimeService } from '../../services/OvertimeService.js';
import { OvertimeRepository } from '../../repositories/OvertimeRepository.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { emitter } from '../../events/emitter.js';
import type { Request, Response, NextFunction } from 'express';

const router  = Router();
const service = new OvertimeService(new OvertimeRepository(), new UserRepository());

router.use(requireAuth);

router.get('/', requirePermission('overtime:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, role, company_id: companyId } = req.user!;
    const result = await service.list(companyId, role, userId, {
      page:         parseInt(req.query.page  as string) || 1,
      limit:        parseInt(req.query.limit as string) || 20,
      status:       req.query.status       as string | undefined,
      targetUserId: req.query.userId       as string | undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/', requirePermission('overtime:request'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const ot = await service.create(companyId, userId, req.body);
    emitter.emit('overtime:requested', {
      companyId,
      managerId:  ot.manager_id,
      userId:     ot.user_id,
      userName:   ot.user_name,
      overtimeId: ot.id,
      hours:      ot.hours,
      date:       ot.date,
    });
    res.status(201).json({ success: true, overtime: ot });
  } catch (err) { next(err); }
});

router.patch('/:id/approve', requirePermission('overtime:approve'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role, company_id: companyId } = req.user!;
    const ot = await service.approve(companyId, id, role, req.params.id);
    emitter.emit('overtime:approved', {
      companyId,
      userId:     ot.user_id,
      overtimeId: ot.id,
      hours:      ot.hours,
    });
    res.json({ success: true, overtime: ot });
  } catch (err) { next(err); }
});

router.patch('/:id/reject', requirePermission('overtime:approve'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role, company_id: companyId } = req.user!;
    const ot = await service.reject(companyId, id, role, req.params.id);
    emitter.emit('overtime:rejected', {
      companyId,
      userId:     ot.user_id,
      overtimeId: ot.id,
    });
    res.json({ success: true, overtime: ot });
  } catch (err) { next(err); }
});

router.patch('/:id/cancel', requirePermission('overtime:request'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await service.cancel(companyId, userId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
