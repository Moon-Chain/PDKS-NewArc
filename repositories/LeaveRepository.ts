import { BaseRepository } from '../core/BaseRepository.js';
import type { LeaveRow } from '../shared/types/leave.js';

export class LeaveRepository extends BaseRepository<LeaveRow> {
  constructor() {
    super('leave_requests');
  }

  async findPage({
    companyId,
    userId,
    managerId,
    status,
    page = 1,
    limit = 20,
  }: {
    companyId:  string;
    userId?:    string;
    managerId?: string;
    status?:    string;
    page?:      number;
    limit?:     number;
  }): Promise<{ rows: LeaveRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [companyId];
    const conditions = ['lr.company_id = $1', 'lr.is_deleted = false'];

    if (userId) {
      params.push(userId);
      conditions.push(`lr.user_id = $${params.length}`);
    }

    if (managerId) {
      params.push(managerId);
      conditions.push(`lr.manager_id = $${params.length}`);
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`lr.status = $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const base  = `FROM leave_requests lr WHERE ${where}`;

    const { rows: countRows } = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) ${base}`, params
    );
    const total = parseInt(countRows[0].count);

    params.push(limit, offset);
    const { rows } = await this.db.query<LeaveRow>(
      `SELECT lr.* ${base} ORDER BY lr.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows, total };
  }

  async findById(id: string, companyId: string): Promise<LeaveRow | null> {
    const { rows } = await this.db.query<LeaveRow>(
      `SELECT * FROM leave_requests WHERE id = $1 AND company_id = $2 AND is_deleted = false`,
      [id, companyId]
    );
    return rows[0] ?? null;
  }

  async createLeave(data: {
    company_id: string;
    user_id:    string;
    user_name:  string;
    manager_id: string;
    start_date: string;
    end_date:   string;
    days:       number;
    reason:     string;
    type:       string;
  }): Promise<LeaveRow> {
    const { rows } = await this.db.query<LeaveRow>(
      `INSERT INTO leave_requests
        (company_id, user_id, user_name, manager_id, start_date, end_date, days, reason, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.company_id, data.user_id, data.user_name, data.manager_id,
        data.start_date, data.end_date, data.days, data.reason, data.type,
      ]
    );
    return rows[0];
  }

  async updateStatus(
    id:        string,
    companyId: string,
    status:    'approved' | 'rejected',
  ): Promise<LeaveRow | null> {
    const { rows } = await this.db.query<LeaveRow>(
      `UPDATE leave_requests SET status = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3 AND is_deleted = false
       RETURNING *`,
      [status, id, companyId]
    );
    return rows[0] ?? null;
  }

  async cancelLeave(id: string, companyId: string, deletedBy: string, reason?: string): Promise<void> {
    await this.db.query(
      `UPDATE leave_requests
       SET is_deleted = true, deleted_at = NOW(), deleted_by = $3, delete_reason = $4
       WHERE id = $1 AND company_id = $2`,
      [id, companyId, deletedBy, reason ?? null]
    );
  }
}
