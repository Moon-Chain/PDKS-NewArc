import { db } from '../db/connection.js';

export interface SettingsRow {
  company_id:                 string;
  office_ip:                  string | null;
  qr_secret:                  string;
  company_name:               string | null;
  work_days_per_week:         number;
  rounding_threshold_minutes: number;
  shift_start:                string;
  shift_end:                  string;
  updated_at:                 string;
}

export class SettingsRepository {
  async get(companyId: string): Promise<SettingsRow> {
    const { rows } = await db.query<SettingsRow>(
      `SELECT * FROM settings WHERE company_id = $1`,
      [companyId]
    );

    if (rows[0]) return rows[0];

    // Ayar satırı yoksa oluştur ve döndür
    const { rows: created } = await db.query<SettingsRow>(
      `INSERT INTO settings (company_id) VALUES ($1)
       ON CONFLICT (company_id) DO UPDATE SET company_id = EXCLUDED.company_id
       RETURNING *`,
      [companyId]
    );
    return created[0];
  }

  async update(companyId: string, data: Partial<Omit<SettingsRow, 'company_id' | 'updated_at'>>): Promise<SettingsRow> {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const sets   = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await db.query<SettingsRow>(
      `UPDATE settings SET ${sets}, updated_at = NOW()
       WHERE company_id = $${keys.length + 1}
       RETURNING *`,
      [...values, companyId]
    );
    return rows[0];
  }
}
