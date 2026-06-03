import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { emitter } from '../../events/emitter.js';
import { logger } from '../../core/Logger.js';

const router = Router();

// SSE bağlantısı — kullanıcı başına bir stream
router.get('/', requireAuth, (req: Request, res: Response) => {
  const { id: userId, company_id: companyId, role } = req.user!;

  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',   // Nginx proxy için
  });

  // Bağlantı açıldığında ack gönder
  res.write(`event: connected\ndata: {"ok":true}\n\n`);

  // Her 25 saniyede heartbeat — proxy timeout'u önler
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 25_000);

  // SSE event helper
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Attendance olayını dinle — kullanıcıya veya takım üyelerine
  const onAttendance = (data: { userId: string; companyId: string; type: string; userName: string }) => {
    if (data.companyId !== companyId) return;
    if (data.userId === userId || role === 'admin' || role === 'mudur') {
      send('attendance', data);
    }
  };

  // Bildirimler — sadece o kullanıcıya
  const onNotification = (data: unknown) => {
    send('notification', data);
  };

  emitter.on('attendance:checkin', onAttendance);
  emitter.on(`notification:${userId}`, onNotification);

  logger.info('SSE bağlantısı açıldı', { userId, companyId });

  // Bağlantı kapanınca temizle
  req.on('close', () => {
    clearInterval(heartbeat);
    emitter.off('attendance:checkin', onAttendance);
    emitter.off(`notification:${userId}`, onNotification);
    logger.info('SSE bağlantısı kapandı', { userId });
  });
});

export default router;
