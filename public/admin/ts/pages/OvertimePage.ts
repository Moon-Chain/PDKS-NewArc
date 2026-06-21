import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { toast, cellUser, paginationControls, bindPagination } from '../adminUi.js';

interface OvertimeRow {
  id: string;
  user_name: string;
  date: string;
  hours: number;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const PER_PAGE = 10;

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'approved', label: 'Onaylanan' },
  { value: 'rejected', label: 'Reddedilen' },
];

function statusBadge(status: OvertimeRow['status']): string {
  switch (status) {
    case 'approved': return '<span class="badge badge-success">Onaylandı</span>';
    case 'rejected': return '<span class="badge badge-error">Reddedildi</span>';
    default:         return '<span class="badge badge-warning">Bekliyor</span>';
  }
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export class OvertimePage extends BasePage {
  private page  = 1;
  private total = 0;
  private rows: OvertimeRow[] = [];
  private status = '';

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE) });
      if (this.status) qs.set('status', this.status);
      const res = await api.get<{ success: boolean; rows: OvertimeRow[]; total: number }>(
        `/api/v1/overtime?${qs.toString()}`
      );
      this.rows  = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Mesai talepleri yüklenemedi', 'error');
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
          <select class="input" id="overtime-status" style="max-width:180px">
            ${STATUS_OPTIONS.map(o => `<option value="${o.value}" ${o.value === this.status ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} talep</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tarih</th>
              <th>Süre</th>
              <th>Açıklama</th>
              <th>Durum</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0
                ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Mesai talebi bulunamadı</td></tr>`
                : this.rows.map(r => `
                  <tr>
                    <td>${cellUser(r.user_name)}</td>
                    <td>${fmtDate(r.date)}</td>
                    <td>${r.hours} Saat</td>
                    <td>${r.description ?? '—'}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;

    this.on('#overtime-status', 'change', async (e) => {
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
