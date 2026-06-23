import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { ExcelService } from '../../services/ExcelService.js';
import { AppError } from '../../core/AppError.js';
import { AuditRepository } from '../../repositories/AuditRepository.js';
import { UserRepository } from '../../repositories/UserRepository.js';

const router    = Router();
const service   = new ExcelService();
const auditRepo = new AuditRepository();
const userRepo  = new UserRepository();

async function logReportDownload(req: { user?: { id: string; company_id: string } }, targetTable: string, newValue: unknown): Promise<void> {
  try {
    const { id: actorId, company_id: companyId } = req.user!;
    const actor = await userRepo.findById(actorId, companyId);
    await auditRepo.insert({
      companyId, actorId, actorName: actor?.name ?? 'Bilinmeyen', action: 'report_download',
      targetTable, newValue,
    });
  } catch {
    // Rapor indirme loglanamadı — indirme işlemini etkilemez
  }
}

// Devam Raporu — Excel indir
router.get('/excel/attendance', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId, id: selfId } = req.user!;

    if (role === 'personel') throw new AppError('Yetersiz yetki', 403);

    const month     = req.query.month     as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate   = req.query.endDate   as string | undefined;
    const userId    = req.query.userId    as string | undefined;

    const targetUser = role === 'takim_lideri' ? (userId ?? selfId) : userId;

    const buffer = await service.generateAttendanceReport({
      companyId,
      month:     month || (startDate ? undefined : new Date().toISOString().slice(0, 7)),
      startDate,
      endDate,
      userId: targetUser,
    });

    const filename = `devam-raporu-${month}${targetUser ? '' : '-tum'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);

    await logReportDownload(req, 'attendance', { month, filename });
  } catch (err) { next(err); }
});

// İzin Raporu — Excel indir
router.get('/excel/leaves', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId } = req.user!;

    if (role !== 'admin' && role !== 'mudur') {
      throw new AppError('Yetersiz yetki', 403);
    }

    const month = req.query.month as string | undefined;

    const buffer = await service.generateLeaveReport({ companyId, month });

    const filename = `izin-raporu${month ? '-' + month : ''}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);

    await logReportDownload(req, 'leaves', { month: month ?? null, filename });
  } catch (err) { next(err); }
});

export default router;
