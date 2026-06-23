import { db } from '../db/connection.js';
import { notificationService } from '../services/NotificationService.js';
import { logger } from '../core/Logger.js';

interface AbsentRow {
  id:         string;
  name:       string;
  company_id: string;
  manager_id: string;
}

async function runAbsentReminder() {
  try {
    const { rows } = await db.query<AbsentRow>(`
      SELECT u.id, u.name, u.company_id, u.manager_id
      FROM users u
      WHERE u.is_deleted = false
        AND u.role NOT IN ('admin', 'deleted')
        AND u.manager_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.user_id    = u.id
            AND a.company_id = u.company_id
            AND a.status     = 'success'
            AND a.type       = 'in'
            AND a.is_deleted = false
            AND DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul')
                = CURRENT_DATE AT TIME ZONE 'Europe/Istanbul'
        )
    `);

    if (!rows.length) return;

    // Yönetici başına grupla
    const byManager = new Map<string, { companyId: string; names: string[] }>();
    for (const r of rows) {
      const key = `${r.manager_id}:${r.company_id}`;
      if (!byManager.has(key)) byManager.set(key, { companyId: r.company_id, names: [] });
      byManager.get(key)!.names.push(r.name);
    }

    for (const [key, { companyId, names }] of byManager) {
      const managerId = key.split(':')[0];
      const list = names.length <= 3
        ? names.join(', ')
        : `${names.slice(0, 3).join(', ')} ve ${names.length - 3} kişi daha`;

      await notificationService.notify({
        companyId,
        userId:  managerId,
        title:   'Giriş Yapmayan Personel',
        message: `Bugün henüz giriş yapmayan personel: ${list}.`,
        type:    'warning',
        link:    '/movements',
      }).catch(err => logger.error('absent_reminder_notify', { error: err.message }));
    }

    logger.info('absent_reminder_done', { absentCount: rows.length });
  } catch (err) {
    logger.error('absent_reminder_error', { error: (err as Error).message });
  }
}

function msUntilNext(hour: number, minute = 0): number {
  const now    = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function startAbsentReminder() {
  function schedule() {
    setTimeout(async () => {
      await runAbsentReminder();
      schedule(); // Ertesi gün aynı saatte tekrar
    }, msUntilNext(10, 0));
  }
  schedule();
  logger.info(`absent_reminder_scheduled → ilk çalışma: ${new Date(Date.now() + msUntilNext(10, 0)).toLocaleString('tr-TR')}`);
}
