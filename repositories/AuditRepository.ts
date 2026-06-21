import { db } from '../db/connection.js';

export interface AuditRow {
  id: string;
  company_id: string | null;
  actor_id: string;
  actor_name: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
}

export class AuditRepository {
  async insert(entry: {
    companyId: string;
    actorId: string;
    actorName: string;
    action: string;
    targetTable?: string;
    targetId?: string;
    newValue?: unknown;
    ipAddress?: string;
  }): Promise<void> {
    await db.query(
      `INSERT INTO audit_log (company_id, actor_id, actor_name, action, target_table, target_id, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.companyId, entry.actorId, entry.actorName, entry.action,
        entry.targetTable ?? null, entry.targetId ?? null,
        entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null,
        entry.ipAddress ?? null,
      ]
    );
  }

  async findPage({
    companyId,
    actor,
    action,
    from,
    to,
    page = 1,
    limit = 20,
  }: {
    companyId: string;
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: AuditRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [companyId];
    const conditions = ['company_id = $1'];

    if (actor) {
      params.push(`%${actor}%`);
      conditions.push(`actor_name ILIKE $${params.length}`);
    }

    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }

    if (from) {
      params.push(from);
      conditions.push(`created_at >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const base  = `FROM audit_log WHERE ${where}`;

    const { rows: countRows } = await db.query<{ count: string }>(
      `SELECT COUNT(*) ${base}`, params
    );
    const total = parseInt(countRows[0].count);

    params.push(limit, offset);
    const { rows } = await db.query<AuditRow>(
      `SELECT * ${base} ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows, total };
  }
}
