import { db } from '../db/connection.js';
import type { Company } from '../shared/types/company.js';

export class CompanyRepository {
  async findById(id: string): Promise<Company | null> {
    const { rows } = await db.query<Company>(
      `SELECT * FROM companies WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const { rows } = await db.query<Company>(
      `SELECT * FROM companies WHERE slug = $1`,
      [slug]
    );
    return rows[0] || null;
  }

  async findAll(): Promise<Company[]> {
    const { rows } = await db.query<Company>(
      `SELECT * FROM companies ORDER BY name ASC`
    );
    return rows;
  }

  async create(data: Partial<Company>): Promise<Company> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const cols = keys.join(', ');
    const phs = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await db.query<Company>(
      `INSERT INTO companies (${cols}) VALUES (${phs}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await db.query<Company>(
      `UPDATE companies SET ${sets}, updated_at = NOW()
       WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0];
  }
}
