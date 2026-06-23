import { randomBytes } from 'crypto';
import { db } from '../db/connection.js';
import { logger } from '../core/Logger.js';

async function runQrRotation() {
  try {
    const { rows } = await db.query<{ company_id: string }>(
      `SELECT company_id FROM settings
       WHERE qr_rotate_interval_hours > 0
         AND NOW() - qr_last_rotated_at >= (qr_rotate_interval_hours * INTERVAL '1 hour')`
    );

    for (const { company_id } of rows) {
      const newSecret = randomBytes(16).toString('hex');
      await db.query(
        `UPDATE settings SET qr_secret = $1, qr_last_rotated_at = NOW(), updated_at = NOW()
         WHERE company_id = $2`,
        [newSecret, company_id]
      );
      logger.info('qr_auto_rotated', { company_id });
    }
  } catch (err) {
    logger.error('qr_rotation_error', { error: (err as Error).message });
  }
}

export function startQrRotation() {
  setInterval(runQrRotation, 30 * 60 * 1000); // 30 dakikada bir kontrol
  logger.info('QR rotation job başlatıldı (30dk aralıklı kontrol)');
}
