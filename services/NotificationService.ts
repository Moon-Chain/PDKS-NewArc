import webpush from 'web-push';
import { emitter } from '../events/emitter.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { db } from '../db/connection.js';
import { logger } from '../core/Logger.js';

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return;
  const pub   = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv  = process.env.VAPID_PRIVATE_KEY?.trim();
  const email = process.env.VAPID_EMAIL || 'mailto:admin@sirket.com';

  if (pub && priv) {
    webpush.setVapidDetails(email, pub, priv);
    vapidReady = true;
    return;
  }

  // İlk çalıştırmada oto-üret ve logla
  const keys = webpush.generateVAPIDKeys();
  logger.warn('⚠️  VAPID anahtarları .env dosyasında bulunamadı — geçici anahtarlar oluşturuldu (yeniden başlatmada değişir):');
  logger.warn(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  logger.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
  webpush.setVapidDetails(email, keys.publicKey, keys.privateKey);
  // Geçici olarak process.env'e yaz ki vapid key endpoint dönebilsin
  process.env.VAPID_PUBLIC_KEY  = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  vapidReady = true;
}

export class NotificationService {
  private repo = new NotificationRepository();

  // Bildirim oluştur → DB + SSE + Push
  async notify(opts: {
    companyId: string;
    userId:    string;
    title:     string;
    message:   string;
    type?:     'info' | 'success' | 'warning' | 'error';
    link?:     string;
  }) {
    const notif = await this.repo.create({
      company_id: opts.companyId,
      user_id:    opts.userId,
      title:      opts.title,
      message:    opts.message,
      type:       opts.type ?? 'info',
      link:       opts.link ?? null,
    });

    // SSE — o kullanıcının açık sekmelerine anında ilet
    emitter.emit(`notification:${opts.userId}`, notif);

    // Web Push — arka planda, başarısız olsa da SSE çalışmış olur
    this._sendPushIfSubscribed(opts.userId, opts.companyId, opts.title, opts.message).catch(() => {});

    return notif;
  }

  private async _sendPushIfSubscribed(userId: string, companyId: string, title: string, body: string) {
    ensureVapid();
    const { rows } = await db.query<{ push_subscription: unknown }>(
      'SELECT push_subscription FROM users WHERE id = $1 AND company_id = $2 AND is_deleted = false',
      [userId, companyId]
    );
    const sub = rows[0]?.push_subscription;
    if (!sub) return;

    try {
      await webpush.sendNotification(
        sub as webpush.PushSubscription,
        JSON.stringify({ title, body })
      );
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Subscription süresi dolmuş — temizle
        await db.query('UPDATE users SET push_subscription = NULL WHERE id = $1', [userId]).catch(() => {});
      } else {
        logger.error('push_send_error', { userId, error: (err as Error).message });
      }
    }
  }

  getVapidPublicKey(): string {
    ensureVapid();
    return process.env.VAPID_PUBLIC_KEY ?? '';
  }

  async saveSubscription(userId: string, companyId: string, subscription: unknown): Promise<void> {
    await db.query(
      'UPDATE users SET push_subscription = $1 WHERE id = $2 AND company_id = $3',
      [JSON.stringify(subscription), userId, companyId]
    );
  }

  async removeSubscription(userId: string, companyId: string): Promise<void> {
    await db.query(
      'UPDATE users SET push_subscription = NULL WHERE id = $1 AND company_id = $2',
      [userId, companyId]
    );
  }

  async list(companyId: string, userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    const [rows, unread] = await Promise.all([
      this.repo.findForUser(companyId, userId, limit, offset),
      this.repo.countUnread(companyId, userId),
    ]);
    return { rows, unread, page, limit };
  }

  async getUnreadCount(companyId: string, userId: string) {
    return this.repo.countUnread(companyId, userId);
  }

  async markRead(companyId: string, userId: string, id: string) {
    await this.repo.markRead(id, userId, companyId);
  }

  async markAllRead(companyId: string, userId: string) {
    await this.repo.markAllRead(companyId, userId);
  }

  async deleteNotification(companyId: string, userId: string, id: string) {
    await this.repo.softDelete(id, userId, companyId);
  }
}

export const notificationService = new NotificationService();
