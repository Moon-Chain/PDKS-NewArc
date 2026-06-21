import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { icon } from '../icons.js';
import { toast, cellUser, paginationControls, bindPagination } from '../adminUi.js';

interface AuditRow {
  id: string;
  actor_name: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const PER_PAGE = 20;

function fmtDateTime(value: string): string {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTarget(table: string | null, id: string | null): string {
  if (!table) return '-';
  if (!id) return table;
  return `${table} · ${id.slice(0, 8)}…`;
}

export class AuditLogPage extends BasePage {
  private page  = 1;
  private total = 0;
  private rows: AuditRow[] = [];
  private actor  = '';
  private action = '';
  private from   = '';
  private to     = '';

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE) });
      if (this.actor)  qs.set('actor', this.actor);
      if (this.action) qs.set('action', this.action);
      if (this.from)   qs.set('from', this.from);
      if (this.to)     qs.set('to', this.to);
      const res = await api.get<{ success: boolean; rows: AuditRow[]; total: number }>(
        `/api/v1/admin/audit?${qs.toString()}`
      );
      this.rows  = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Aktivite geçmişi yüklenemedi', 'error');
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
        <div class="toolbar" style="flex-wrap:wrap; gap:8px">
          <input class="input" id="audit-actor" type="text" placeholder="Aktör ara..." value="${this.actor}" style="max-width:180px">
          <input class="input" id="audit-action" type="text" placeholder="Eylem (ör. login)" value="${this.action}" style="max-width:160px">
          <input class="input" id="audit-from" type="date" value="${this.from}" style="max-width:160px">
          <input class="input" id="audit-to" type="date" value="${this.to}" style="max-width:160px">
          <button class="btn btn-secondary" id="audit-filter">${icon('search', 'icon icon-sm')} Filtrele</button>
          <button class="btn btn-ghost" id="audit-clear">Temizle</button>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} kayıt</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Aktör</th>
              <th>Eylem</th>
              <th>Hedef</th>
              <th>IP Adresi</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0
                ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Kayıt bulunamadı</td></tr>`
                : this.rows.map(r => `
                  <tr>
                    <td>${fmtDateTime(r.created_at)}</td>
                    <td>${cellUser(r.actor_name)}</td>
                    <td>${r.action}</td>
                    <td>${fmtTarget(r.target_table, r.target_id)}</td>
                    <td>${r.ip_address ?? '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;

    this.on('#audit-filter', 'click', async () => {
      this.actor  = (this.$('#audit-actor') as HTMLInputElement).value.trim();
      this.action = (this.$('#audit-action') as HTMLInputElement).value.trim();
      this.from   = (this.$('#audit-from') as HTMLInputElement).value;
      this.to     = (this.$('#audit-to') as HTMLInputElement).value;
      this.page = 1;
      await this.load();
    });
    this.on('#audit-clear', 'click', async () => {
      this.actor = '';
      this.action = '';
      this.from = '';
      this.to = '';
      this.page = 1;
      await this.load();
    });
    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });
  }
}
