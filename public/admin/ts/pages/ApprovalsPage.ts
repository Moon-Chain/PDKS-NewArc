import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { icon } from '../icons.js';
import { toast, cellUser } from '../adminUi.js';

interface LeaveRow {
  id: string;
  user_name: string;
  start_date: string;
  end_date: string;
  days: number;
  type: 'annual' | 'report' | 'excuse';
  reason: string;
}

interface OvertimeRow {
  id: string;
  user_name: string;
  date: string;
  hours: number;
  description: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  annual: 'Yıllık İzin',
  report: 'Rapor',
  excuse: 'Mazeret İzni',
};

function fmtRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('tr-TR', opts);
  const e = new Date(end).toLocaleDateString('tr-TR', opts);
  return s === e ? s : `${s} - ${e}`;
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function approvalCard(id: string, name: string, meta: string, note: string): string {
  return `
    <div class="approval-card" data-id="${id}">
      <div>
        ${cellUser(name)}
        <div class="approval-meta">${meta}</div>
        ${note ? `<div class="approval-meta" style="margin-top:4px">${note}</div>` : ''}
      </div>
      <div class="approval-actions">
        <button class="btn btn-primary btn-sm" data-action="approve">${icon('check', 'icon icon-sm')} Onayla</button>
        <button class="btn btn-ghost btn-sm" data-action="reject">${icon('x', 'icon icon-sm')} Reddet</button>
      </div>
    </div>`;
}

export class ApprovalsPage extends BasePage {
  private leaves: LeaveRow[] = [];
  private overtimes: OvertimeRow[] = [];

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const [leavesRes, overtimeRes] = await Promise.all([
        api.get<{ success: boolean; rows: LeaveRow[]; total: number }>('/api/v1/leaves?status=pending&limit=50'),
        api.get<{ success: boolean; rows: OvertimeRow[]; total: number }>('/api/v1/overtime?status=pending&limit=50'),
      ]);
      this.leaves    = leavesRes.rows;
      this.overtimes = overtimeRes.rows;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Onay listesi yüklenemedi', 'error');
      this.leaves = [];
      this.overtimes = [];
    }
    this.draw();
  }

  private draw(): void {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">İzin Talepleri (${this.leaves.length})</div>
        ${this.leaves.length === 0
          ? `<p style="color:var(--text-muted)">Bekleyen izin talebi yok</p>`
          : this.leaves.map(l => approvalCard(
              l.id, l.user_name,
              `${fmtRange(l.start_date, l.end_date)} · ${l.days} gün · ${TYPE_LABELS[l.type] ?? l.type}`,
              l.reason ? `"${l.reason}"` : '',
            )).join('')}
      </div>
      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">Mesai Talepleri (${this.overtimes.length})</div>
        ${this.overtimes.length === 0
          ? `<p style="color:var(--text-muted)">Bekleyen mesai talebi yok</p>`
          : this.overtimes.map(o => approvalCard(
              o.id, o.user_name,
              `${fmtDate(o.date)} · ${o.hours} Saat`,
              o.description ? `"${o.description}"` : '',
            )).join('')}
      </div>
    `;

    this.on('[data-action="approve"]', 'click', (e) => {
      const card = (e.target as HTMLElement).closest('.approval-card') as HTMLElement;
      this.handleAction(card, 'approve');
    });
    this.on('[data-action="reject"]', 'click', (e) => {
      const card = (e.target as HTMLElement).closest('.approval-card') as HTMLElement;
      this.handleAction(card, 'reject');
    });
  }

  private async handleAction(card: HTMLElement, action: 'approve' | 'reject'): Promise<void> {
    const id = card.dataset.id!;
    const isLeave = this.leaves.some(l => l.id === id);
    const endpoint = isLeave ? `/api/v1/leaves/${id}/${action}` : `/api/v1/overtime/${id}/${action}`;
    try {
      await api.patch(endpoint, {});
      toast(action === 'approve' ? 'Talep onaylandı' : 'Talep reddedildi', 'success');
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'İşlem başarısız', 'error');
    }
  }
}
