import { db } from '../db/connection.js';

export interface NotificationRow {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  link: string | null;
  is_deleted: boolean;
  created_at: string;
}

export class NotificationRepository {
  async create(data: {
    company_id: string;
    user_id:    string;
    title:      string;
    message:    string;
    type?:      string;
    link?:      string | null;
  }): Promise<NotificationRow> {
    const { rows } = await db.query<NotificationRow>(
      `INSERT INTO notifications (company_id, user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.company_id, data.user_id, data.title, data.message, data.type ?? 'info', data.link ?? null]
    );
    return rows[0];
  }

  async findForUser(companyId: string, userId: string, limit = 30, offset = 0): Promise<NotificationRow[]> {
    const { rows } = await db.query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE company_id = $1 AND user_id = $2 AND is_deleted = false
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [companyId, userId, limit, offset]
    );
    return rows;
  }

  async countUnread(companyId: string, userId: string): Promise<number> {
    const { rows } = await db.query<{ count: string }>(
      `SELECT COUNT(*) FROM notifications
       WHERE company_id = $1 AND user_id = $2 AND is_read = false AND is_deleted = false
         AND created_at > NOW() - INTERVAL '7 days'`,
      [companyId, userId]
    );
    return parseInt(rows[0].count);
  }

  async markRead(id: string, userId: string, companyId: string): Promise<void> {
    await db.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2 AND company_id = $3`,
      [id, userId, companyId]
    );
  }

  async markAllRead(companyId: string, userId: string): Promise<void> {
    await db.query(
      `UPDATE notifications SET is_read = true
       WHERE company_id = $1 AND user_id = $2 AND is_read = false AND is_deleted = false`,
      [companyId, userId]
    );
  }

  async softDelete(id: string, userId: string, companyId: string): Promise<void> {
    await db.query(
      `UPDATE notifications SET is_deleted = true
       WHERE id = $1 AND user_id = $2 AND company_id = $3`,
      [id, userId, companyId]
    );
  }
}
