import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/roles.js';
import { LeaveService } from '../../services/LeaveService.js';
import { LeaveRepository } from '../../repositories/LeaveRepository.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { emitter } from '../../events/emitter.js';
import type { Request, Response, NextFunction } from 'express';

const router  = Router();
const service = new LeaveService(new LeaveRepository(), new UserRepository());

router.use(requireAuth);

// GET /api/v1/leaves — liste
router.get('/', requirePermission('leave:view'), async (req: Request, res: Response, next: NextFunction) => {
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

// POST /api/v1/leaves — yeni talep
router.post('/', requirePermission('leave:request'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const leave = await service.create(companyId, userId, req.body);
    emitter.emit('leave:requested', {
      companyId,
      managerId: leave.manager_id,
      userId:    leave.user_id,
      userName:  leave.user_name,
      leaveId:   leave.id,
      days:      leave.days,
      type:      leave.type,
    });
    res.status(201).json({ success: true, leave });
  } catch (err) { next(err); }
});

// PATCH /api/v1/leaves/:id/approve
router.patch('/:id/approve', requirePermission('leave:approve'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: approverId, role, company_id: companyId } = req.user!;
    const leave = await service.approve(companyId, approverId, role, req.params.id);
    emitter.emit('leave:approved', {
      companyId,
      userId:       leave.user_id,
      approverName: approverId,
      leaveId:      leave.id,
      days:         leave.days,
    });
    res.json({ success: true, leave });
  } catch (err) { next(err); }
});

// PATCH /api/v1/leaves/:id/reject
router.patch('/:id/reject', requirePermission('leave:approve'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: approverId, role, company_id: companyId } = req.user!;
    const leave = await service.reject(companyId, approverId, role, req.params.id);
    emitter.emit('leave:rejected', {
      companyId,
      userId:       leave.user_id,
      approverName: approverId,
      leaveId:      leave.id,
    });
    res.json({ success: true, leave });
  } catch (err) { next(err); }
});

// PATCH /api/v1/leaves/:id/cancel — kendi talebini iptal et
router.patch('/:id/cancel', requirePermission('leave:request'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    await service.cancel(companyId, userId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
