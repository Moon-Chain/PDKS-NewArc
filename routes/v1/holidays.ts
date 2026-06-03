import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import { HolidayRepository } from '../../repositories/HolidayRepository.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const repo   = new HolidayRepository();

router.use(requireAuth);

// GET /api/v1/holidays?year=2026 — tatil listesi
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const rows = await repo.findByYear(companyId, year);
    res.json({ success: true, rows });
  } catch (err) { next(err); }
});

// POST /api/v1/holidays — yeni tatil ekle (admin/mudur)
router.post('/', requireRole('admin', 'mudur'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;
    const { date, name, is_half_day } = req.body as { date?: string; name?: string; is_half_day?: boolean };

    if (!date || !name?.trim()) {
      res.status(400).json({ error: 'Tarih ve isim zorunlu' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ error: 'Tarih YYYY-MM-DD formatında olmalı' });
      return;
    }

    const year = parseInt(date.split('-')[0]);
    const holiday = await repo.create(companyId, {
      year,
      date,
      name: name.trim(),
      is_half_day: is_half_day ?? false,
    });
    res.status(201).json({ success: true, holiday });
  } catch (err) { next(err); }
});

// DELETE /api/v1/holidays/:id — tatil sil (admin/mudur)
router.delete('/:id', requireRole('admin', 'mudur'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz ID' }); return; }
    const deleted = await repo.deleteById(id, companyId);
    if (!deleted) { res.status(404).json({ error: 'Tatil bulunamadı veya şirkete ait değil' }); return; }
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/holidays/seed — varsayılan tatilleri yükle (admin)
router.post('/seed', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;
    const year = parseInt(req.body?.year) || new Date().getFullYear();
    const count = await repo.seedDefaults(companyId, year);
    res.json({ success: true, inserted: count, year });
  } catch (err) { next(err); }
});

export default router;
