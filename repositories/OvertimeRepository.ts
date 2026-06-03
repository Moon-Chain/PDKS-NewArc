import { BaseRepository } from '../core/BaseRepository.js';
import type { OvertimeRow } from '../shared/types/overtime.js';

export class OvertimeRepository extends BaseRepository<OvertimeRow> {
  constructor() { super('overtime_requests'); }

  async createOvertime(data: {
    company_id: string; user_id: string; user_name: string;
    manager_id: string; date: string; hours: number; description: string;
  }): Promise<OvertimeRow> {
    const { rows } = await this.db.query<OvertimeRow>(
      `INSERT INTO overtime_requests (company_id,user_id,user_name,manager_id,date,hours,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.company_id,data.user_id,data.user_name,data.manager_id,
       data.date,data.hours,data.description]
    );
    return rows[0];
  }

  async findPage({
    companyId, userId, managerId, status, page = 1, limit = 20,
  }: {
    companyId: string; userId?: string; managerId?: string;
    status?: string; page?: number; limit?: number;
  }): Promise<{ rows: OvertimeRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [companyId];
    const conds = ['company_id = $1', 'is_deleted = false'];

    if (userId)   { params.push(userId);   conds.push(`user_id = $${params.length}`); }
    if (managerId){ params.push(managerId); conds.push(`manager_id = $${params.length}`); }
    if (status && status !== 'all') { params.push(status); conds.push(`status = $${params.length}`); }

    const where = conds.join(' AND ');
    const { rows: cr } = await this.db.query<{count:string}>(`SELECT COUNT(*) FROM overtime_requests WHERE ${where}`, params);
    const total = parseInt(cr[0].count);

    params.push(limit, offset);
    const { rows } = await this.db.query<OvertimeRow>(
      `SELECT * FROM overtime_requests WHERE ${where} ORDER BY created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    return { rows, total };
  }

  async findById(id: string, companyId: string): Promise<OvertimeRow | null> {
    const { rows } = await this.db.query<OvertimeRow>(
      `SELECT * FROM overtime_requests WHERE id=$1 AND company_id=$2 AND is_deleted=false`,
      [id, companyId]
    );
    return rows[0] ?? null;
  }

  async updateStatus(id: string, companyId: string, status: 'approved'|'rejected'): Promise<OvertimeRow|null> {
    const { rows } = await this.db.query<OvertimeRow>(
      `UPDATE overtime_requests SET status=$1, updated_at=NOW()
       WHERE id=$2 AND company_id=$3 AND is_deleted=false RETURNING *`,
      [status, id, companyId]
    );
    return rows[0] ?? null;
  }

  async cancelOvertime(id: string, companyId: string, deletedBy: string): Promise<void> {
    await this.db.query(
      `UPDATE overtime_requests SET is_deleted=true, deleted_at=NOW(), deleted_by=$3
       WHERE id=$1 AND company_id=$2`,
      [id, companyId, deletedBy]
    );
  }
}
