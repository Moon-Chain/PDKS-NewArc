import { BasePage } from '../../../ts/core/BasePage.js';
import { state } from '../../../ts/core/StateManager.js';
import { api } from '../../../ts/core/ApiClient.js';
import { icon } from '../icons.js';
import { toast, openModal } from '../adminUi.js';

interface UserProfile { name: string; }

interface DashboardData {
  present: number;
  presentList: Array<{ id: string; name: string; detail: string }>;
  onLeave: number;
  onLeaveList: Array<{ id: string; name: string; detail: string }>;
  totalStaff: number;
  pendingLeaves: number;
  pendingOvertime: number;
  pendingLeaveRows: Array<{ name: string; start_date: string; end_date: string; days: number }>;
  pendingOvertimeRows: Array<{ name: string; date: string; hours: number }>;
  upcomingHolidays: Array<{ name: string; date: string }>;
  departments: Array<{ dept: string; count: number }>;
  roleCounts: { admin: number; mudur: number; takim_lideri: number; personel: number };
  recentActivity: Array<{ actor: string; action: string; target_table: string | null; created_at: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  approve: 'onayladı', reject: 'reddetti', update: 'güncelledi',
  delete: 'sildi', create: 'oluşturdu', login: 'giriş yaptı',
};

function statCard(iconName: string, label: string, value: string, foot: string, theme: string, modalType?: string): string {
  return `
    <div class="card stat-card stat-theme-${theme}${modalType ? ' stat-card-clickable' : ''}" ${modalType ? `data-stat-modal="${modalType}"` : ''}>
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        <span class="stat-icon stat-icon-${theme}">${icon(iconName)}</span>
      </div>
      <div class="stat-value tnum">${value}</div>
      <div class="stat-foot">${foot}</div>
    </div>`;
}

function activityItem(actor: string, action: string, time: string): string {
  return `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${actor}</strong> ${action}</div>
        <div class="activity-time">${time}</div>
      </div>
    </div>`;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function fmtRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  const s = new Date(start).toLocaleDateString('tr-TR', opts);
  const e = new Date(end).toLocaleDateString('tr-TR', opts);
  return s === e ? s : `${s} - ${e}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export class DashboardPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;

    let data: DashboardData | null = null;
    try {
      data = await api.get<DashboardData>('/api/v1/admin/dashboard');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gösterge paneli yüklenemedi', 'error');
    }

    if (!data) {
      this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Veriler yüklenemedi.</p></div>`;
      return;
    }

    const profile  = state.get<UserProfile>('profile');
    const firstName = (profile?.name ?? '').split(' ')[0] || '';
    const pendingTotal = data.pendingLeaves + data.pendingOvertime;
    const maxDept = Math.max(1, ...data.departments.map(d => d.count));
    const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    const presentPct = data.totalStaff > 0 ? Math.round(data.present / data.totalStaff * 100) : 0;

    this.container.innerHTML = `
      <div class="greeting">
        <div>
          <h2>İyi günler, ${firstName}</h2>
          <div class="greeting-sub">Şu an ofiste <strong>${data.present}</strong> kişi var · <strong>${pendingTotal}</strong> talep onayınızı bekliyor</div>
        </div>
        <div class="greeting-date">${icon('calendar-days')} <span>${today}</span></div>
      </div>

      <div class="stat-grid">
        ${statCard('door-open', 'Şu An İçeride', `${data.present} / ${data.totalStaff}`, `Personelin %${presentPct}'i ofiste`, 'info', 'inside')}
        ${statCard('inbox', 'Bekleyen Onaylar', `${pendingTotal}`, `${data.pendingLeaves} izin · ${data.pendingOvertime} mesai talebi`, 'warning', 'pending')}
        ${statCard('palmtree', 'Bugün İzinli', `${data.onLeave}`, data.onLeaveList.map(o => o.name).join(', ') || 'Yok', 'success', 'onleave')}
        ${statCard('users', 'Toplam Personel', `${data.totalStaff}`, `${data.departments.length} departman`, 'accent', 'total')}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">
            <span>Son Aktiviteler</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/audit">${icon('arrow-right', 'icon icon-sm')} Tüm Geçmişi Gör</button>
          </div>
          <div class="activity-list">
            ${data.recentActivity.length === 0
              ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Aktivite kaydı yok</p>`
              : data.recentActivity.map(a => activityItem(
                  a.actor,
                  `${ACTION_LABELS[a.action] ?? a.action}${a.target_table ? ' · ' + a.target_table : ''}`,
                  timeAgo(a.created_at)
                )).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">Hızlı Erişim</div>
          <div style="display:flex; flex-direction:column; gap: var(--space-2)">
            <button class="btn btn-primary" style="justify-content:flex-start" data-nav="/admin/users">${icon('user-plus')} Yeni Personel Ekle</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/approvals">${icon('inbox')} Bekleyen Onayları Gör</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/reports">${icon('download')} Aylık Excel Raporu İndir</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/holidays">${icon('calendar-plus')} Tatil Günü Ekle</button>
          </div>
        </div>
      </div>

      <div class="widget-grid">
        <div class="card">
          <div class="card-title">
            <span>Bekleyen İzin Talepleri</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/approvals">${icon('arrow-right', 'icon icon-sm')}</button>
          </div>
          <div class="widget-list">
            ${data.pendingLeaveRows.length === 0
              ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Bekleyen izin talebi yok</p>`
              : data.pendingLeaveRows.map(l => `
                  <div class="widget-row">
                    <span>${l.name}</span>
                    <span class="widget-meta">${fmtRange(l.start_date, l.end_date)} · ${l.days} gün</span>
                  </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/leaves">${icon('calendar-days', 'icon icon-sm')} Tüm İzinleri Gör</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Yaklaşan Tatiller</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/holidays">${icon('arrow-right', 'icon icon-sm')}</button>
          </div>
          <div class="widget-list">
            ${data.upcomingHolidays.length === 0
              ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Yaklaşan tatil yok</p>`
              : data.upcomingHolidays.map(h => `
                  <div class="widget-row">
                    <span>${h.name}</span>
                    <span class="widget-meta">${fmtDate(h.date)}</span>
                  </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/holidays">${icon('sun', 'icon icon-sm')} Tüm Tatilleri Gör</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Departman Dağılımı</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/users">${icon('arrow-right', 'icon icon-sm')}</button>
          </div>
          <div class="widget-list">
            ${data.departments.length === 0
              ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Personel kaydı yok</p>`
              : data.departments.map(d => `
                  <div class="widget-row">
                    <span>${d.dept}</span>
                    <div class="dept-bar"><div class="dept-bar-fill" style="width:${(d.count / maxDept * 100)}%"></div></div>
                    <span class="widget-meta">${d.count}</span>
                  </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/users">${icon('users', 'icon icon-sm')} Tüm Personeli Gör</button>
        </div>
      </div>
    `;

    this.$$('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.getAttribute('data-nav');
        if (path) this.navigate(path);
      });
    });

    this.$$('[data-stat-modal]').forEach((el) => {
      el.addEventListener('click', () => {
        const type = el.getAttribute('data-stat-modal');
        if (type) this.openStatModal(type, data!, maxDept);
      });
    });
  }

  private navigate(path: string): void {
    (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate(path);
  }

  private openStatModal(type: string, data: DashboardData, maxDept: number): void {
    if (type === 'inside') {
      const rows = data.presentList.map(p => `
        <div class="widget-row"><span>${p.name}</span><span class="widget-meta">${p.detail}</span></div>`).join('');
      const { close } = openModal('Şu An İçeride', `
        <div class="widget-list">${rows || '<div class="widget-row"><span class="widget-meta">İçeride kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon('clock', 'icon icon-sm')} Tüm Hareketleri Gör</button>
      `);
      this.bindStatModalNav(close, '/admin/movements');
    } else if (type === 'pending') {
      const leaveRows = data.pendingLeaveRows.map(l => `
        <div class="widget-row"><span>${l.name}</span><span class="widget-meta">${fmtRange(l.start_date, l.end_date)} · ${l.days} gün</span></div>`).join('');
      const overtimeRows = data.pendingOvertimeRows.map(o => `
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${fmtDate(o.date)} · ${o.hours} saat</span></div>`).join('');
      const { close } = openModal('Bekleyen Onaylar', `
        <div class="modal-section-title">İzin Talepleri (${data.pendingLeaves})</div>
        <div class="widget-list">${leaveRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <div class="modal-section-title">Mesai Talepleri (${data.pendingOvertime})</div>
        <div class="widget-list">${overtimeRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon('check-check', 'icon icon-sm')} Onaylar Sayfasına Git</button>
      `);
      this.bindStatModalNav(close, '/admin/approvals');
    } else if (type === 'onleave') {
      const rows = data.onLeaveList.map(o => `
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${o.detail}</span></div>`).join('');
      const { close } = openModal('Bugün İzinli', `
        <div class="widget-list">${rows || '<div class="widget-row"><span class="widget-meta">Bugün izinli kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon('calendar-days', 'icon icon-sm')} Tüm İzinleri Gör</button>
      `);
      this.bindStatModalNav(close, '/admin/leaves');
    } else if (type === 'total') {
      const deptRows = data.departments.map(d => `
        <div class="widget-row">
          <span>${d.dept}</span>
          <div class="dept-bar"><div class="dept-bar-fill" style="width:${(d.count / maxDept * 100)}%"></div></div>
          <span class="widget-meta">${d.count}</span>
        </div>`).join('');
      const { close } = openModal('Toplam Personel', `
        <div class="modal-section-title">Departmana Göre</div>
        <div class="widget-list">${deptRows || '<div class="widget-row"><span class="widget-meta">Personel kaydı yok</span></div>'}</div>
        <div class="modal-section-title">Role Göre</div>
        <div class="widget-list">
          <div class="widget-row"><span>Yönetici</span><span class="widget-meta">${data.roleCounts.admin}</span></div>
          <div class="widget-row"><span>Müdür</span><span class="widget-meta">${data.roleCounts.mudur}</span></div>
          <div class="widget-row"><span>Takım Lideri</span><span class="widget-meta">${data.roleCounts.takim_lideri}</span></div>
          <div class="widget-row"><span>Personel</span><span class="widget-meta">${data.roleCounts.personel}</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon('users', 'icon icon-sm')} Tüm Personeli Gör</button>
      `);
      this.bindStatModalNav(close, '/admin/users');
    }
  }

  private bindStatModalNav(close: () => void, path: string): void {
    document.getElementById('stat-modal-nav')?.addEventListener('click', () => {
      close();
      this.navigate(path);
    });
  }
}
