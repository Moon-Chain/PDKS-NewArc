import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { AttendanceService } from '../../services/AttendanceService.js';
import { AttendanceRepository } from '../../repositories/AttendanceRepository.js';
import { SettingsRepository } from '../../repositories/SettingsRepository.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { OvertimeRepository } from '../../repositories/OvertimeRepository.js';
import { AppError } from '../../core/AppError.js';

const router  = Router();
const userRepo = new UserRepository();
const service = new AttendanceService(
  new AttendanceRepository(),
  new SettingsRepository(),
  new OvertimeRepository(),  // otomatik mesai için
  userRepo,
);

// Bugünkü hareketler + mevcut durum
router.get('/today', requireAuth, async (req, res, next) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const [logs, status] = await Promise.all([
      service.getTodayLogs(userId, companyId),
      service.getStatus(userId, companyId),
    ]);
    res.json({ success: true, logs, status });
  } catch (err) { next(err); }
});

// Mevcut durum
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;
    const status = await service.getStatus(userId, companyId);
    res.json({ success: true, ...status });
  } catch (err) { next(err); }
});

// QR değeri (ofis ekranında / ayarlar sayfasında gösterilecek)
router.get('/qr', requireAuth, async (req, res, next) => {
  try {
    const { company_id: companyId } = req.user!;
    const qr = await service.getQrValue(companyId);
    res.json({ success: true, ...qr });
  } catch (err) { next(err); }
});

// Giriş / Çıkış
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { id: userId, company_id: companyId } = req.user!;

    const { type, qrValue, latitude, longitude, isOffline } = req.body as {
      type:       string;
      qrValue:    string;
      latitude?:  number;
      longitude?: number;
      isOffline?: boolean;
    };

    if (!['in', 'out'].includes(type)) {
      throw new AppError('type "in" veya "out" olmalı', 400);
    }

    // Kullanıcı adını DB'den çek (denormalizasyon için)
    const user = await userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';

    const log = await service.checkIn({
      userId,
      userName: user.name,
      companyId,
      type: type as 'in' | 'out',
      ip,
      qrValue,
      latitude,
      longitude,
      isOffline,
    });

    res.status(201).json({ success: true, log });
  } catch (err) { next(err); }
});

// Admin stats — bugünkü durum (sadece admin)
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);
    const stats = await service.getTodayStats(companyId);
    res.json({ success: true, ...stats });
  } catch (err) { next(err); }
});

// Bekleyen manuel kayıtlar (admin onayı için)
router.get('/pending-manual', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);
    const rows = await service.getPendingManual(companyId);
    res.json({ success: true, rows });
  } catch (err) { next(err); }
});

// Manuel kayıt onayla
router.patch('/:id/approve-manual', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);
    const log = await service.approveManual(req.params.id, companyId);
    if (!log) throw new AppError('Kayıt bulunamadı', 404);
    res.json({ success: true, log });
  } catch (err) { next(err); }
});

// Manuel kayıt — admin/müdür
router.post('/manual', requireAuth, async (req, res, next) => {
  try {
    const { id: actorId, role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);

    const { userId, type, date, time } = req.body as Record<string, string>;
    if (!userId || !['in','out'].includes(type) || !date || !time)
      throw new AppError('userId, type, date ve time zorunlu', 400);

    const user = await userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    const ts = new Date(`${date}T${time}:00`);
    if (isNaN(ts.getTime())) throw new AppError('Geçersiz tarih/saat', 400);

    const log = await service.createManual({
      companyId, userId, userName: user.name,
      type: type as 'in' | 'out', timestamp: ts.toISOString(),
      ipAddress: `manual:${actorId}`,
    });
    res.status(201).json({ success: true, log });
  } catch (err) { next(err); }
});

// Kayıt güncelle — admin/müdür
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);
    const { type, date, time } = req.body as Record<string, string>;
    const data: { type?: 'in' | 'out'; timestamp?: string } = {};
    if (type && ['in','out'].includes(type)) data.type = type as 'in' | 'out';
    if (date && time) {
      const ts = new Date(`${date}T${time}:00`);
      if (!isNaN(ts.getTime())) data.timestamp = ts.toISOString();
    }
    const log = await service.updateRecord(req.params.id, companyId, data);
    if (!log) throw new AppError('Kayıt bulunamadı', 404);
    res.json({ success: true, log });
  } catch (err) { next(err); }
});

// Kayıt sil (soft delete) — admin/müdür
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id: actorId, role, company_id: companyId } = req.user!;
    if (role !== 'admin' && role !== 'mudur') throw new AppError('Yetersiz yetki', 403);
    await service.deleteRecord(req.params.id, companyId, actorId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Sayfalı liste
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { id: userId, role, company_id: companyId } = req.user!;
    const result = await service.getPage(companyId, role, userId, {
      page:         parseInt(req.query.page as string) || 1,
      limit:        parseInt(req.query.limit as string) || 50,
      month:        req.query.month as string | undefined,
      targetUserId: req.query.userId as string | undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

export default router;
