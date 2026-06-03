import { db } from '../db/connection.js';
import { HOLIDAYS_2026 } from '../shared/holidays.js';

export interface HolidayRow {
  id: number;
  company_id: string | null;
  year: number;
  date: string;
  name: string;
  is_half_day: boolean;
}

export class HolidayRepository {
  // Şirkete özel + genel (NULL) tatilleri döndür — date TEXT olarak döner (timezone sorunu yok)
  async findByYear(companyId: string, year: number): Promise<HolidayRow[]> {
    const { rows } = await db.query<HolidayRow>(
      `SELECT id, company_id, year, TO_CHAR(date,'YYYY-MM-DD') AS date, name, is_half_day
       FROM holidays
       WHERE year = $1 AND (company_id IS NULL OR company_id = $2)
       ORDER BY date ASC`,
      [year, companyId]
    );
    return rows;
  }

  async create(companyId: string, data: {
    year: number;
    date: string;
    name: string;
    is_half_day: boolean;
  }): Promise<HolidayRow> {
    const { rows } = await db.query<HolidayRow>(
      `INSERT INTO holidays (company_id, year, date, name, is_half_day)
       VALUES ($1, $2, $3::date, $4, $5)
       ON CONFLICT (company_id, date) DO UPDATE SET name = EXCLUDED.name, is_half_day = EXCLUDED.is_half_day
       RETURNING id, company_id, year, TO_CHAR(date,'YYYY-MM-DD') AS date, name, is_half_day`,
      [companyId, data.year, data.date, data.name, data.is_half_day]
    );
    return rows[0];
  }

  async deleteById(id: number, companyId: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `DELETE FROM holidays WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    return (rowCount ?? 0) > 0;
  }

  // Tarih tatil mi? (şirkete özel veya genel)
  async isHoliday(date: string, companyId: string): Promise<boolean> {
    const { rows } = await db.query(
      `SELECT 1 FROM holidays
       WHERE date = $1::date AND (company_id IS NULL OR company_id = $2)
       LIMIT 1`,
      [date, companyId]
    );
    return rows.length > 0;
  }

  // Hardcode tatilleri şirkete ait DB kaydına çevir (ilk kurulum)
  async seedDefaults(companyId: string, targetYear?: number): Promise<number> {
    // Tarih string'lerini hedef yıla çevir (örn: 2026 → 2027)
    const sourceYear = 2026;
    const y = targetYear ?? sourceYear;
    const holidays = HOLIDAYS_2026.map(h => ({
      ...h,
      date: y === sourceYear ? h.date : h.date.replace(String(sourceYear), String(y)),
    }));
    if (!holidays.length) return 0;

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const h of holidays) {
      const year = parseInt(h.date.split('-')[0]);
      placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      values.push(companyId, year, h.date, h.name, h.isHalfDay ?? false);
    }

    const { rowCount } = await db.query(
      `INSERT INTO holidays (company_id, year, date, name, is_half_day) VALUES ${placeholders.join(',')}
       ON CONFLICT (company_id, date) DO NOTHING`,
      values
    );
    return rowCount ?? 0;
  }

  // İki tarih arasındaki iş günlerini DB'den hesapla
  async countWorkDays(startDate: string, endDate: string, companyId: string): Promise<number> {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;

    // DB'deki tatilleri çek
    const startYear = s.getFullYear();
    const endYear   = e.getFullYear();

    const { rows } = await db.query<{ date: string }>(
      `SELECT TO_CHAR(date,'YYYY-MM-DD') AS date FROM holidays
       WHERE year BETWEEN $1 AND $2
         AND (company_id IS NULL OR company_id = $3)`,
      [startYear, endYear, companyId]
    );
    const holidaySet = new Set(rows.map(r => r.date));

    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const iso = cur.toISOString().split('T')[0];
      if (cur.getDay() !== 0 && !holidaySet.has(iso)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  }
}
