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
  companyId: string;
  month:     string;       // 'YYYY-MM'
  userId?:   string;       // belirli bir personel
}

interface LeaveExcelOptions {
  companyId: string;
  month?:    string;
}

export class ExcelService {

  /* ─── DEVAM RAPORU ─────────────────────────────────────── */

  async generateAttendanceReport(opts: AttendanceExcelOptions): Promise<Buffer> {
    const [year, mon] = opts.month.split('-').map(Number);
    const startDate   = `${opts.month}-01`;
    const endDate     = new Date(year, mon, 0).toISOString().split('T')[0]; // ayın son günü

    // Günlük özet: ilk giriş, son çıkış
    const params: (string | number)[] = [opts.companyId, startDate, endDate];
    let userFilter = '';
    if (opts.userId) {
      params.push(opts.userId);
      userFilter = `AND a.user_id = $${params.length}`;
    }

    const { rows } = await db.query<{
      user_id:   string;
      user_name: string;
      day:       string;
      first_in:  string | null;
      last_out:  string | null;
    }>(`
      SELECT
        a.user_id,
        a.user_name,
        DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul') AS day,
        MIN(CASE WHEN a.type='in'  THEN a.timestamp END) AS first_in,
        MAX(CASE WHEN a.type='out' THEN a.timestamp END) AS last_out
      FROM attendance a
      WHERE a.company_id = $1
        AND DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul') BETWEEN $2 AND $3
        AND a.status = 'success'
        AND a.is_deleted = false
        ${userFilter}
      GROUP BY a.user_id, a.user_name, DATE(a.timestamp AT TIME ZONE 'Europe/Istanbul')
      ORDER BY a.user_name, day
    `, params);

    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'PDKS';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Devam Raporu', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Başlık
    const monthLabel = new Date(year, mon - 1, 1)
      .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Devam Raporu — ${monthLabel}`;
    titleCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // Sütun başlıkları
    ws.addRow(['Personel', 'Tarih', 'Gün', 'İlk Giriş', 'Son Çıkış', 'Çalışma (Saat)', 'Durum']);
    const headerRow = ws.lastRow!;
    headerRow.height = 20;
    headerRow.eachCell(cell => {
      cell.font  = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF97316' } },
      };
    });

    // Sütun genişlikleri
    ws.columns = [
      { key: 'name',   width: 22 },
      { key: 'date',   width: 14 },
      { key: 'day',    width: 8  },
      { key: 'in',     width: 12 },
      { key: 'out',    width: 12 },
      { key: 'hours',  width: 16 },
      { key: 'status', width: 14 },
    ];

    const DAY_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    let rowIdx = 0;
    for (const r of rows) {
      const dayDate   = new Date(r.day);
      const dayOfWeek = DAY_TR[dayDate.getUTCDay()];
      const dateLabel = dayDate.toLocaleDateString('tr-TR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
      const inTime    = r.first_in
        ? new Date(r.first_in).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })
        : '—';
      const outTime   = r.last_out
        ? new Date(r.last_out).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })
        : '—';

      let workHours = 0;
      if (r.first_in && r.last_out) {
        const diff = new Date(r.last_out).getTime() - new Date(r.first_in).getTime();
        workHours  = Math.round((diff / 3600000) * 10) / 10;
      }

      const status = !r.first_in ? 'Eksik Giriş' : !r.last_out ? 'Çıkış Yok' : workHours >= 8 ? 'Tam Mesai' : 'Eksik Mesai';

      const row = ws.addRow([
        r.user_name,
        dateLabel,
        dayOfWeek,
        inTime,
        outTime,
        workHours > 0 ? workHours : '—',
        status,
      ]);

      // Satır rengi (alternating + hafta sonu)
      const isSunday = dayDate.getUTCDay() === 0;
      const isSat    = dayDate.getUTCDay() === 6;
      const bgColor  = (isSunday || isSat) ? 'FF1C1C20' : (rowIdx % 2 === 0 ? 'FF18181B' : 'FF111113');

      row.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { color: { argb: 'FFFAFAFA' } };
        cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
      });

      // Durum sütunu rengi
      const statusCell = row.getCell(7);
      if (status === 'Tam Mesai')    statusCell.font = { color: { argb: 'FF22C55E' }, bold: true };
      else if (status === 'Eksik Mesai') statusCell.font = { color: { argb: 'FFEAB308' }, bold: true };
      else                           statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };

      rowIdx++;
    }

    // Özet satırı
    if (rows.length > 0) {
      const totalHours = rows.reduce((acc, r) => {
        if (!r.first_in || !r.last_out) return acc;
        const diff = new Date(r.last_out).getTime() - new Date(r.first_in).getTime();
        return acc + diff / 3600000;
      }, 0);

      ws.addRow([]);
      const sumRow = ws.addRow(['', '', '', '', 'TOPLAM', `${totalHours.toFixed(1)} Saat`, `${rows.length} gün`]);
      sumRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFF97316' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
        cell.alignment = { horizontal: 'center' };
      });
    }

    // Freeze header rows
    ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 0 }];

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
      dateFilter = `AND start_date BETWEEN $2 AND $3`;
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
      SELECT u.name as user_name, l.start_date, l.end_date, l.days,
             l.type, l.status, l.reason
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      WHERE l.company_id = $1 ${dateFilter}
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
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
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
