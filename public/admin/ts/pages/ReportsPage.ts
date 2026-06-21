import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { icon } from '../icons.js';
import { toast, paginationControls, bindPagination } from '../adminUi.js';

interface ReportHistoryRow {
  id: string;
  actor_name: string;
  action: string;
  target_table: string | null;
  new_value: { month?: string | null; filename?: string } | null;
  created_at: string;
}

const PER_PAGE = 6;

const TARGET_LABELS: Record<string, string> = {
  attendance: 'Devam Raporu',
  leaves: 'İzin Raporu',
};

function fmtDateTime(value: string): string {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export class ReportsPage extends BasePage {
  private page  = 1;
  private total = 0;
  private rows: ReportHistoryRow[] = [];

  async render(): Promise<void> {
    const month = currentMonth();
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">Devam Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay</label>
            <input class="input" type="month" id="attendance-month" value="${month}" />
          </div>
        </div>
        <button class="btn btn-primary" id="attendance-download">${icon('download')} Excel Olarak İndir</button>
      </div>

      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">İzin Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay (opsiyonel)</label>
            <input class="input" type="month" id="leaves-month" value="${month}" />
          </div>
        </div>
        <button class="btn btn-primary" id="leaves-download">${icon('download')} Excel Olarak İndir</button>
      </div>

      <div class="card" id="reports-history-card" style="margin-top: var(--space-4)">
        <div class="card-title">Geçmiş Raporlar</div>
        <p style="color:var(--text-muted)">Yükleniyor...</p>
      </div>
    `;

    this.on('#attendance-download', 'click', () => {
      const m = (this.$('#attendance-month') as HTMLInputElement).value || month;
      window.location.href = `/api/v1/reports/excel/attendance?month=${m}`;
      setTimeout(() => this.loadHistory(), 1500);
    });

    this.on('#leaves-download', 'click', () => {
      const m = (this.$('#leaves-month') as HTMLInputElement).value;
      const url = m ? `/api/v1/reports/excel/leaves?month=${m}` : '/api/v1/reports/excel/leaves';
      window.location.href = url;
      setTimeout(() => this.loadHistory(), 1500);
    });

    await this.loadHistory();
  }

  private get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }

  private async loadHistory(): Promise<void> {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE), action: 'report_download' });
      const res = await api.get<{ success: boolean; rows: ReportHistoryRow[]; total: number }>(
        `/api/v1/admin/audit?${qs.toString()}`
      );
      this.rows  = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Geçmiş raporlar yüklenemedi', 'error');
      this.rows = [];
      this.total = 0;
    }
    this.drawHistory();
  }

  private drawHistory(): void {
    const card = this.$('#reports-history-card') as HTMLElement;
    if (!card) return;

    card.innerHTML = `
      <div class="card-title">Geçmiş Raporlar</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Tür</th>
            <th>Dönem</th>
            <th>Oluşturulma</th>
            <th>Oluşturan</th>
          </tr></thead>
          <tbody>
            ${this.rows.length === 0
              ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Henüz oluşturulmuş rapor yok</td></tr>`
              : this.rows.map(r => `
                <tr>
                  <td>${TARGET_LABELS[r.target_table ?? ''] ?? r.target_table ?? '-'}</td>
                  <td>${r.new_value?.month ?? '—'}</td>
                  <td>${fmtDateTime(r.created_at)}</td>
                  <td>${r.actor_name}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
      ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
    `;

    bindPagination(card, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.loadHistory();
    });
  }
}
