import { db } from '../db/connection.js';
import { AppError } from './AppError.js';

// SQL injection güvenliği: sadece bu sütunlar WHERE koşulunda kullanılabilir
const ALLOWED_COLUMNS = new Set([
  'user_id', 'company_id', 'status', 'type', 'manager_id',
  'is_deleted', 'is_read', 'role', 'date', 'start_date', 'end_date',
  'personnel_id', 'is_active', 'branch_id',
]);

export type WhereCondition = { column: string; value: unknown };

export interface FindAllOptions {
  companyId: string;
  conditions?: WhereCondition[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export class BaseRepository<T extends object> {
  protected table: string;
  protected db = db;

  constructor(tableName: string) {
    this.table = tableName;
  }

  private buildWhere(conditions: WhereCondition[], startIndex = 1) {
    const parts: string[] = [];
    const values: unknown[] = [];

    for (const { column, value } of conditions) {
      if (!ALLOWED_COLUMNS.has(column)) {
        throw new Error(`İzinsiz sütun: ${column}`);
      }
      parts.push(`${column} = $${startIndex + values.length}`);
      values.push(value);
    }

    return { sql: parts.join(' AND '), values };
  }

  async findById(id: string, companyId: string): Promise<T | null> {
    const { rows } = await this.db.query<T>(
      `SELECT * FROM ${this.table}
       WHERE id = $1 AND company_id = $2 AND is_deleted = false`,
      [id, companyId]
    );
    return rows[0] || null;
  }

  async findAll({ companyId, conditions = [], orderBy = 'created_at DESC', limit = 100, offset = 0 }: FindAllOptions): Promise<T[]> {
    const allConditions: WhereCondition[] = [
      { column: 'company_id', value: companyId },
      { column: 'is_deleted', value: false },
      ...conditions,
    ];
    const { sql, values } = this.buildWhere(allConditions);

    const { rows } = await this.db.query<T>(
      `SELECT * FROM ${this.table}
       WHERE ${sql}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    return rows;
  }

  async create(data: Partial<T> & Record<string, unknown>, companyId: string): Promise<T> {
    const full = { ...data, company_id: companyId };
    const keys = Object.keys(full);
    const values = Object.values(full);
    const cols = keys.join(', ');
    const phs = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await this.db.query<T>(
      `INSERT INTO ${this.table} (${cols}) VALUES (${phs}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id: string, data: Partial<T> & Record<string, unknown>, companyId: string): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await this.db.query<T>(
      `UPDATE ${this.table} SET ${sets}, updated_at = NOW()
       WHERE id = $${keys.length + 1} AND company_id = $${keys.length + 2}
       RETURNING *`,
      [...values, id, companyId]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }

  async softDelete(id: string, companyId: string, deletedBy: string | null = null): Promise<T> {
    const { rows } = await this.db.query<T>(
      `UPDATE ${this.table}
       SET is_deleted = true, deleted_at = NOW(), deleted_by = $3, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [id, companyId, deletedBy]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }

  async count(companyId: string, conditions: WhereCondition[] = []): Promise<number> {
    const allConditions: WhereCondition[] = [
      { column: 'company_id', value: companyId },
      { column: 'is_deleted', value: false },
      ...conditions,
    ];
    const { sql, values } = this.buildWhere(allConditions);

    const { rows } = await this.db.query(
      `SELECT COUNT(*) FROM ${this.table} WHERE ${sql}`,
      values
    );
    return parseInt(rows[0].count as string);
  }
}
