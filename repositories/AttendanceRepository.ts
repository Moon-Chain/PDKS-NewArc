import { BaseRepository } from '../core/BaseRepository.js';
import type { AttendanceRow } from '../shared/types/attendance.js';

export class AttendanceRepository extends BaseRepository<AttendanceRow> {
  constructor() {
    super('attendance');
  }

  async createManual(data: {
    company_id: string; user_id: string; user_name: string;
    type: 'in' | 'out'; timestamp: string; ip_address?: string | null;
  }): Promise<AttendanceRow> {
    const { rows } = await this.db.query<AttendanceRow>(
      `INSERT INTO attendance
        (company_id, user_id, user_name, type, timestamp, ip_address, status, is_remote, manual_entry, offline_queued)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',false,true,false)
       RETURNING *`,
      [data.company_id, data.user_id, data.user_name, data.type,
       data.timestamp, data.ip_address ?? null]
    );
    return rows[0];
  }

  async approveManual(id: string, companyId: string): Promise<AttendanceRow | null> {
    const { rows } = await this.db.query<AttendanceRow>(
      `UPDATE attendance SET status='success', updated_at=NOW()
       WHERE id=$1 AND company_id=$2 AND manual_entry=true AND is_deleted=false RETURNING *`,
      [id, companyId]
    );
    return rows[0] ?? null;
  }

  async findPendingManual(companyId: string): Promise<AttendanceRow[]> {
    const { rows } = await this.db.query<AttendanceRow>(
      `SELECT * FROM attendance
       WHERE company_id=$1 AND status='pending' AND manual_entry=true AND is_deleted=false
       ORDER BY timestamp DESC`,
      [companyId]
    );
    return rows;
  }

  async getTodayStats(companyId: string, shiftStart: string): Promise<{
    present:     number; presentList:  Array<{id:string;name:string;detail:string}>;
    onLeave:     number; onLeaveList:  Array<{id:string;name:string;detail:string}>;
    late:        number; lateList:     Array<{id:string;name:string;detail:string}>;
    absent:      number; absentList:   Array<{id:string;name:string;detail:string}>;
    totalStaff:  number;
  }> {
    // Aktif personel
    const { rows: users } = await this.db.query<{id:string;name:string;title:string|null}>(
      `SELECT id, name, title FROM users WHERE company_id=$1 AND is_deleted=false AND role != 'deleted'`,
      [companyId]
    );

    // Bugünkü başarılı kayıtlar (Istanbul saat dilimine göre)
    const { rows: todayLogs } = await this.db.query<{user_id:string;type:string;timestamp:string}>(
      `SELECT user_id, type, timestamp FROM attendance
       WHERE company_id=$1 AND is_deleted=false AND status='success'
         AND DATE(timestamp AT TIME ZONE 'Europe/Istanbul') = CURRENT_DATE AT TIME ZONE 'Europe/Istanbul'
       ORDER BY timestamp ASC`,
      [companyId]
    );

    // Bugün aktif onaylı izinler
    const { rows: leaves } = await this.db.query<{user_id:string}>(
      `SELECT user_id FROM leave_requests
       WHERE company_id=$1 AND status='approved' AND is_deleted=false
         AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`,
      [companyId]
    );

    const onLeaveIds = new Set(leaves.map(l => l.user_id));

    // Son aksiyonu belirle
    const lastAction = new Map<string, string>();
    const firstIn    = new Map<string, string>();
    for (const log of todayLogs) {
      lastAction.set(log.user_id, log.type);
      if (log.type === 'in' && !firstIn.has(log.user_id)) {
        const t = new Date(log.timestamp);
        firstIn.set(log.user_id, t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }));
      }
    }

    const presentIds = new Set<string>();
    lastAction.forEach((type, uid) => { if (type === 'in') presentIds.add(uid); });

    const lateIds = new Set<string>();
    firstIn.forEach((time, uid) => { if (time > shiftStart) lateIds.add(uid); });

    const userMap = new Map(users.map(u => [u.id, u]));
    const mk = (uid: string, detail: string) => ({ id: uid, name: userMap.get(uid)?.name ?? uid, detail });

    const presentList  = [...presentIds].map(uid => mk(uid, `Giriş: ${firstIn.get(uid) ?? '-'}`));
    const onLeaveList  = [...onLeaveIds].map(uid => mk(uid, userMap.get(uid)?.title ?? 'İzinli'));
    const lateList     = [...lateIds].map(uid => mk(uid, `Giriş: ${firstIn.get(uid) ?? '-'}`));
    const absentList   = users
      .filter(u => !presentIds.has(u.id) && !onLeaveIds.has(u.id))
      .map(u => mk(u.id, u.title ?? 'Personel'));

    return {
      totalStaff: users.length,
      present:    presentIds.size,  presentList,
      onLeave:    onLeaveIds.size,  onLeaveList,
      late:       lateIds.size,     lateList,
      absent:     absentList.length, absentList,
    };
  }

  async updateRecord(id: string, companyId: string, data: { type?: 'in' | 'out'; timestamp?: string }): Promise<AttendanceRow | null> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (data.type)      { vals.push(data.type);      sets.push(`type = $${vals.length}`); }
    if (data.timestamp) { vals.push(data.timestamp); sets.push(`timestamp = $${vals.length}`); }
    if (!sets.length) return null;
    vals.push(id, companyId);
    const { rows } = await this.db.query<AttendanceRow>(
      `UPDATE attendance SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${vals.length - 1} AND company_id = $${vals.length} AND is_deleted = false
       RETURNING *`,
      vals
    );
    return rows[0] ?? null;
  }

  async softDeleteRecord(id: string, companyId: string, deletedBy: string): Promise<void> {
    await this.db.query(
      `UPDATE attendance SET is_deleted=true, deleted_at=NOW(), deleted_by=$3
       WHERE id=$1 AND company_id=$2`,
      [id, companyId, deletedBy]
    );
  }

  async findToday(companyId: string, userId?: string): Promise<AttendanceRow[]> {
    let query = `
      SELECT a.*, u.name as user_name_live
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE a.company_id = $1
        AND DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul') = CURRENT_DATE AT TIME ZONE 'Europe/Istanbul'
        AND a.is_deleted = false`;
    const params: unknown[] = [companyId];

    if (userId) {
      params.push(userId);
      query += ` AND a.user_id = $${params.length}`;
    }

    query += ' ORDER BY a.timestamp DESC';
    const { rows } = await this.db.query<AttendanceRow>(query, params);
    return rows;
  }

  async findLast(userId: string, companyId: string): Promise<AttendanceRow | null> {
    const { rows } = await this.db.query<AttendanceRow>(
      `SELECT * FROM attendance
       WHERE user_id = $1 AND company_id = $2 AND status = 'success' AND is_deleted = false
       ORDER BY timestamp DESC
       LIMIT 1`,
      [userId, companyId]
    );
    return rows[0] || null;
  }

  async findPage({
    companyId,
    userId,
    managerId,
    page = 1,
    limit = 50,
    month,
  }: {
    companyId:  string;
    userId?:    string;
    managerId?: string;
    page?:      number;
    limit?:     number;
    month?:     string;
  }): Promise<{ rows: AttendanceRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [companyId];
    const conditions = ['a.company_id = $1', 'a.is_deleted = false'];

    if (userId) {
      params.push(userId);
      conditions.push(`a.user_id = $${params.length}`);
    }

    if (managerId) {
      params.push(managerId);
      conditions.push(`u.manager_id = $${params.length}`);
    }

    if (month) {
      params.push(month);
      conditions.push(`TO_CHAR(a.timestamp AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM') = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const baseQuery = `FROM attendance a JOIN users u ON u.id = a.user_id WHERE ${where}`;

    const { rows: countRows } = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) ${baseQuery}`,
      params
    );
    const total = parseInt(countRows[0].count);

    params.push(limit, offset);
    const { rows } = await this.db.query<AttendanceRow>(
      `SELECT a.* ${baseQuery} ORDER BY a.timestamp DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows, total };
  }
}
