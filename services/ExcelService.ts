import ExcelJS from 'exceljs';
import { db } from '../db/connection.js';

interface ReportRow {
  user_name:  string;
  date_label: string;
  first_in:   string | null;
  last_out:   string | null;
  work_hours: number;
  type_label: string;
}

interface AttendanceExcelOptions {
  companyId:  string;
  month?:     string;      // 'YYYY-MM'
  startDate?: string;      // 'YYYY-MM-DD' (month yerine kullanılabilir)
  endDate?:   string;      // 'YYYY-MM-DD'
  userId?:    string;      // belirli bir personel; yoksa → kişi başı sheet
}

interface LeaveExcelOptions {
  companyId: string;
  month?:    string;
}

export class ExcelService {

  /* ─── DEVAM RAPORU ─────────────────────────────────────── */

  async generateAttendanceReport(opts: AttendanceExcelOptions): Promise<Buffer> {
    // Tarih aralığını hesapla — month veya startDate/endDate'den biri kullanılır
    let startDate: string;
    let endDate:   string;
    let reportLabel: string;

    if (opts.startDate && opts.endDate) {
      startDate   = opts.startDate;
      endDate     = opts.endDate;
      reportLabel = `${startDate} – ${endDate}`;
    } else {
      const month   = opts.month || new Date().toISOString().slice(0, 7);
      const [year, mon] = month.split('-').map(Number);
      startDate   = `${month}-01`;
      endDate     = new Date(year, mon, 0).toISOString().split('T')[0];
      reportLabel = new Date(year, mon - 1, 1)
        .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }

    // Günlük özet: ilk giriş, son çıkış
    const params: (string | number)[] = [opts.companyId, startDate, endDate];
    let userFilter = '';
    if (opts.userId) {
      params.push(opts.userId);
      userFilter = `AND a.user_id = $${params.length}`;
    }

    // leave_requests için aynı userId filtresi
    let leaveUserFilter = '';
    if (opts.userId) {
      leaveUserFilter = `AND lr.user_id = $${params.length}`;
    }

    const { rows } = await db.query<{
      user_id:    string;
      user_name:  string;
      day:        string;
      first_in:   string | null;
      last_out:   string | null;
      leave_type: string | null;
    }>(`
      WITH att AS (
        SELECT
          a.user_id, a.user_name,
          DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul') AS day,
          MIN(CASE WHEN a.type='in'  THEN a.timestamp END) AS first_in,
          MAX(CASE WHEN a.type='out' THEN a.timestamp END) AS last_out
        FROM attendance a
        WHERE a.company_id = $1
          AND DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul') BETWEEN $2 AND $3
          AND a.status = 'success'
          AND a.is_deleted = false
          ${userFilter}
        GROUP BY a.user_id, a.user_name,
                 DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul')
      ),
      lv AS (
        SELECT lr.user_id, lr.user_name,
               gs.day::date AS day,
               lr.type      AS leave_type
        FROM leave_requests lr
        CROSS JOIN LATERAL generate_series(
          GREATEST(lr.start_date, $2::date),
          LEAST(lr.end_date,      $3::date),
          '1 day'::interval
        ) gs(day)
        WHERE lr.company_id = $1
          AND lr.status    = 'approved'
          AND lr.is_deleted = false
          ${leaveUserFilter}
      )
      SELECT
        COALESCE(att.user_id,   lv.user_id)   AS user_id,
        COALESCE(att.user_name, lv.user_name) AS user_name,
        COALESCE(att.day,       lv.day)       AS day,
        att.first_in,
        att.last_out,
        lv.leave_type
      FROM att
      FULL OUTER JOIN lv
        ON att.user_id = lv.user_id AND att.day = lv.day
      ORDER BY user_name, day
    `, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PDKS';
    workbook.created = new Date();

    type ReportRow = typeof rows[0];
    const DAY_TR   = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const LEAVE_LABELS: Record<string, string> = {
      annual: 'Yıllık İzin', report: 'Rapor', excuse: 'Mazeret İzni',
    };

    const fillSheet = (ws: ExcelJS.Worksheet, sheetRows: ReportRow[], label: string) => {
      ws.columns = [
        { key: 'name',   width: 22 },
        { key: 'date',   width: 14 },
        { key: 'day',    width: 8  },
        { key: 'in',     width: 12 },
        { key: 'out',    width: 12 },
        { key: 'hours',  width: 16 },
        { key: 'status', width: 14 },
      ];

      ws.mergeCells('A1:G1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `Devam Raporu — ${label}`;
      titleCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      ws.addRow(['Personel', 'Tarih', 'Gün', 'İlk Giriş', 'Son Çıkış', 'Çalışma (Saat)', 'Durum']);
      const headerRow = ws.lastRow!;
      headerRow.height = 20;
      headerRow.eachCell(cell => {
        cell.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA6C0A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      let rowIdx = 0;
      for (const r of sheetRows) {
        const dayDate   = new Date(r.day);
        const dayOfWeek = DAY_TR[dayDate.getUTCDay()];
        const dateLabel = dayDate.toLocaleDateString('tr-TR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
        const inTime    = r.first_in  ? new Date(r.first_in).toLocaleTimeString('tr-TR',  { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }) : '—';
        const outTime   = r.last_out  ? new Date(r.last_out).toLocaleTimeString('tr-TR',  { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }) : '—';

        let workHours = 0;
        if (r.first_in && r.last_out) {
          workHours = Math.round(((new Date(r.last_out).getTime() - new Date(r.first_in).getTime()) / 3600000) * 10) / 10;
        }

        let status: string;
        if (r.leave_type && !r.first_in)  status = LEAVE_LABELS[r.leave_type] ?? 'İzinli';
        else if (!r.first_in)              status = 'Eksik Giriş';
        else if (!r.last_out)              status = 'Çıkış Yok';
        else if (workHours >= 8)           status = 'Tam Mesai';
        else                               status = 'Eksik Mesai';

        const row = ws.addRow([r.user_name, dateLabel, dayOfWeek, inTime, outTime, workHours > 0 ? workHours : '—', status]);

        const isSunday = dayDate.getUTCDay() === 0;
        const isSat    = dayDate.getUTCDay() === 6;
        const bgColor  = (isSunday || isSat) ? 'FF1C1C20' : (rowIdx % 2 === 0 ? 'FF18181B' : 'FF111113');
        row.eachCell((cell, colNum) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font      = { color: { argb: 'FFFAFAFA' } };
          cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
        });

        const sc = row.getCell(7);
        if (r.leave_type && !r.first_in)   sc.font = { color: { argb: 'FF60A5FA' }, bold: true };
        else if (status === 'Tam Mesai')   sc.font = { color: { argb: 'FF22C55E' }, bold: true };
        else if (status === 'Eksik Mesai') sc.font = { color: { argb: 'FFEAB308' }, bold: true };
        else                               sc.font = { color: { argb: 'FFEF4444' }, bold: true };

        rowIdx++;
      }

      if (sheetRows.length > 0) {
        const totalHours = sheetRows.reduce((acc, r) => {
          if (!r.first_in || !r.last_out) return acc;
          return acc + (new Date(r.last_out).getTime() - new Date(r.first_in).getTime()) / 3600000;
        }, 0);
        ws.addRow([]);
        const sumRow = ws.addRow(['', '', '', '', 'TOPLAM', `${totalHours.toFixed(1)} Saat`, `${sheetRows.length} gün`]);
        sumRow.eachCell(cell => {
          cell.font      = { bold: true, color: { argb: 'FFF97316' } };
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
          cell.alignment = { horizontal: 'center' };
        });
      }

      ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 0 }];
    };

    if (!opts.userId) {
      // Toplu: her personel ayrı sheet
      const byUser = new Map<string, ReportRow[]>();
      for (const r of rows) {
        if (!byUser.has(r.user_name)) byUser.set(r.user_name, []);
        byUser.get(r.user_name)!.push(r);
      }
      if (byUser.size === 0) {
        fillSheet(workbook.addWorksheet('Veri Yok', { pageSetup: { paperSize: 9, orientation: 'landscape' } }), [], reportLabel);
      }
      for (const [userName, userRows] of byUser) {
        const safeName = userName.slice(0, 31).replace(/[:\\/?*[\]]/g, '_');
        fillSheet(
          workbook.addWorksheet(safeName, { pageSetup: { paperSize: 9, orientation: 'landscape' } }),
          userRows,
          `${userName} — ${reportLabel}`
        );
      }
    } else {
      // Tek kullanıcı — tek sheet
      fillSheet(
        workbook.addWorksheet('Devam Raporu', { pageSetup: { paperSize: 9, orientation: 'landscape' } }),
        rows,
        reportLabel
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /* ─── İZİN RAPORU ──────────────────────────────────────── */

  async generateLeaveReport(opts: LeaveExcelOptions): Promise<Buffer> {
    const params: (string | undefined)[] = [opts.companyId];
    let dateFilter = '';
    if (opts.month) {
      const [y, m] = opts.month.split('-').map(Number);
      const startDate = `${opts.month}-01`;
      const endDate   = new Date(y, m, 0).toISOString().split('T')[0];
      params.push(startDate, endDate);
      dateFilter = `AND lr.start_date BETWEEN $2 AND $3`;
    }

    const { rows } = await db.query<{
      user_name:  string;
      start_date: string;
      end_date:   string;
      days:       number;
      type:       string;
      status:     string;
      reason:     string | null;
    }>(`
      SELECT lr.user_name, lr.start_date, lr.end_date, lr.days,
             lr.type, lr.status, lr.reason
      FROM leave_requests lr
      WHERE lr.company_id = $1
        AND lr.is_deleted = false
        ${dateFilter}
      ORDER BY l.start_date DESC
    `, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PDKS';

    const ws = workbook.addWorksheet('İzin Raporu');

    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'İzin Raporu';
    titleCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.addRow(['Personel', 'Başlangıç', 'Bitiş', 'Gün', 'Tür', 'Durum', 'Açıklama']);
    const headerRow = ws.lastRow!;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA6C0A' } };
      cell.alignment = { horizontal: 'center' };
    });

    ws.columns = [
      { key: 'name',   width: 22 },
      { key: 'start',  width: 14 },
      { key: 'end',    width: 14 },
      { key: 'days',   width: 8  },
      { key: 'type',   width: 16 },
      { key: 'status', width: 14 },
      { key: 'reason', width: 30 },
    ];

    const TYPE_LABELS: Record<string, string> = {
      annual: 'Yıllık İzin', report: 'Rapor', excuse: 'Mazeret',
    };
    const STATUS_LABELS: Record<string, string> = {
      pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi',
    };

    rows.forEach((r, i) => {
      const row = ws.addRow([
        r.user_name,
        new Date(r.start_date).toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
        new Date(r.end_date).toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
        r.days,
        TYPE_LABELS[r.type] ?? r.type,
        STATUS_LABELS[r.status] ?? r.status,
        r.reason ?? '',
      ]);

      const bgColor = i % 2 === 0 ? 'FF18181B' : 'FF111113';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { color: { argb: 'FFFAFAFA' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.getCell(1).alignment = { horizontal: 'left' };
      row.getCell(7).alignment = { horizontal: 'left' };

      const sc = row.getCell(6);
      if (r.status === 'approved') sc.font = { color: { argb: 'FF22C55E' }, bold: true };
      else if (r.status === 'rejected') sc.font = { color: { argb: 'FFEF4444' }, bold: true };
      else sc.font = { color: { argb: 'FFEAB308' }, bold: true };
    });

    ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 0 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
