import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { ExcelService } from '../../services/ExcelService.js';
import { AppError } from '../../core/AppError.js';

const router  = Router();
const service = new ExcelService();

// Devam Raporu — Excel indir
router.get('/excel/attendance', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId, id: selfId } = req.user!;

    const month  = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const userId = req.query.userId as string | undefined;

    // Personel sadece kendi raporunu indirebilir
    if (role === 'personel' && userId && userId !== selfId) {
      throw new AppError('Yetersiz yetki', 403);
    }

    const targetUser = role === 'personel' ? selfId : userId;

    const buffer = await service.generateAttendanceReport({
      companyId,
      month,
      userId: targetUser,
    });

    const filename = `devam-raporu-${month}${targetUser ? '' : '-tum'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
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
  } catch (err) { next(err); }
});

export default router;
