import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { toast, cellUser, paginationControls, bindPagination } from '../adminUi.js';

interface AttendanceRow {
  id: string;
  user_name: string;
  type: 'in' | 'out';
  timestamp: string;
  ip_address: string | null;
  status: 'success' | 'error' | 'pending';
}

const PER_PAGE = 15;

function statusBadge(status: AttendanceRow['status']): string {
  switch (status) {
    case 'success': return '<span class="badge badge-success">Başarılı</span>';
    case 'pending': return '<span class="badge badge-warning">Onay Bekliyor</span>';
    default:        return '<span class="badge badge-error">Hatalı</span>';
  }
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export class MovementsPage extends BasePage {
  private page  = 1;
  private total = 0;
  private rows: AttendanceRow[] = [];
  private month = new Date().toISOString().slice(0, 7);

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const res = await api.get<{ success: boolean; rows: AttendanceRow[]; total: number }>(
        `/api/v1/attendance?page=${this.page}&limit=${PER_PAGE}&month=${this.month}`
      );
      this.rows  = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Hareketler yüklenemedi', 'error');
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
          <input class="input" type="month" id="movements-month" value="${this.month}" style="max-width:160px" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} hareket</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tür</th>
              <th>Zaman</th>
              <th>Durum</th>
              <th>IP</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0
                ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Hareket bulunamadı</td></tr>`
                : this.rows.map(r => `
                  <tr>
                    <td>${cellUser(r.user_name)}</td>
                    <td>${r.type === 'in' ? 'Giriş' : 'Çıkış'}</td>
                    <td>${formatTime(r.timestamp)}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>${r.ip_address ?? '—'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;

    this.on('#movements-month', 'change', async (e) => {
      this.month = (e.target as HTMLInputElement).value;
      this.page = 1;
      await this.load();
    });
    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });
  }
}
