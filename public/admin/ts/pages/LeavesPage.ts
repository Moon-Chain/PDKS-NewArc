import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { toast, cellUser, paginationControls, bindPagination } from '../adminUi.js';

interface LeaveRow {
  id: string;
  user_name: string;
  start_date: string;
  end_date: string;
  days: number;
  type: 'annual' | 'report' | 'excuse';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

const PER_PAGE = 10;

const TYPE_LABELS: Record<string, string> = {
  annual: 'Yıllık İzin',
  report: 'Rapor',
  excuse: 'Mazeret İzni',
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'approved', label: 'Onaylanan' },
  { value: 'rejected', label: 'Reddedilen' },
];

function statusBadge(status: LeaveRow['status']): string {
  switch (status) {
    case 'approved': return '<span class="badge badge-success">Onaylandı</span>';
    case 'rejected': return '<span class="badge badge-error">Reddedildi</span>';
    default:         return '<span class="badge badge-warning">Bekliyor</span>';
  }
}

function fmtRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('tr-TR', opts);
  const e = new Date(end).toLocaleDateString('tr-TR', opts);
  return s === e ? s : `${s} - ${e}`;
}

export class LeavesPage extends BasePage {
  private page  = 1;
  private total = 0;
  private rows: LeaveRow[] = [];
  private status = '';

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE) });
      if (this.status) qs.set('status', this.status);
      const res = await api.get<{ success: boolean; rows: LeaveRow[]; total: number }>(
        `/api/v1/leaves?${qs.toString()}`
      );
      this.rows  = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'İzinler yüklenemedi', 'error');
      this.rows = [];
      this.total = 0;
    }
    this.draw();
  }

  private get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }

  private draw(): void {
    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <select class="input" id="leaves-status" style="max-width:180px">
            ${STATUS_OPTIONS.map(o => `<option value="${o.value}" ${o.value === this.status ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} talep</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tarih Aralığı</th>
              <th>Gün</th>
              <th>Tür</th>
              <th>Durum</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0
                ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">İzin talebi bulunamadı</td></tr>`
                : this.rows.map(r => `
                  <tr>
                    <td>${cellUser(r.user_name)}</td>
                    <td>${fmtRange(r.start_date, r.end_date)}</td>
                    <td>${r.days}</td>
                    <td>${TYPE_LABELS[r.type] ?? r.type}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;

    this.on('#leaves-status', 'change', async (e) => {
      this.status = (e.target as HTMLSelectElement).value;
      this.page = 1;
      await this.load();
    });
    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });
  }
}
