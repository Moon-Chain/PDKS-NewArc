import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import { getHolidayNamesSync, preload } from '../core/HolidayCache.js';
import { renderAvatar, alpineAvatar } from '../core/Avatar.js';

interface AttendanceRow {
  id: string; user_id: string; user_name: string;
  type: 'in' | 'out'; timestamp: string;
  ip_address: string | null; status: 'success' | 'error' | 'pending';
  error_message: string | null; is_remote: boolean;
  offline_queued: boolean; manual_entry: boolean;
}
interface SimpleUser { id: string; name: string; personnel_id: string; avatar_path?: string; }
interface OvertimeRow { id: string; user_id: string; date: string; hours: number; description: string | null; status: string; }
interface LeaveRow { id: string; user_id: string; start_date: string; end_date: string; days: number; type: string; status: string; }

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const LIST_PER_PAGE = 20;

// ── SVG ikonlar ──────────────────────────────────────────────
const I_CAL   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const I_BACK  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const I_DOWN  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const I_PLUS  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const I_CHEVR = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const I_PREV  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const I_NEXT  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const I_IN    = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
const I_OUT   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const I_CLOCK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const I_FILE  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const I_LOGIN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
const I_EDIT  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const I_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const I_X      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const I_SEARCH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

// ── Takvim builder ────────────────────────────────────────────
function buildCalendar(
  month: string,
  allRows: AttendanceRow[],
  isPriv: boolean,
  overtimeRows: OvertimeRow[],
  leaveRows: LeaveRow[],
  holidayNames: Map<string, string>,
): string {
  const [year, mo] = month.split('-').map(Number);
  const firstDay   = new Date(year, mo - 1, 1);
  const totalDays  = new Date(year, mo, 0).getDate();
  const startDow   = (firstDay.getDay() + 6) % 7;

  const today          = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mo;
  const todayDay       = isCurrentMonth ? today.getDate() : -1;

  // Giriş/çıkış → gün bazında
  const byDate = new Map<string, { inT: string; outT: string; hours: number }>();
  for (const r of allRows) {
    const d   = new Date(r.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!byDate.has(key)) byDate.set(key, { inT: '', outT: '', hours: 0 });
    const entry = byDate.get(key)!;
    const t = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (r.type === 'in')  { if (!entry.inT  || t < entry.inT)  entry.inT  = t; }
    if (r.type === 'out') { if (!entry.outT || t > entry.outT) entry.outT = t; }
  }
  byDate.forEach(e => {
    if (e.inT && e.outT) {
      const [ih, im] = e.inT.split(':').map(Number);
      const [oh, om] = e.outT.split(':').map(Number);
      e.hours = Math.max(0, ((oh * 60 + om) - (ih * 60 + im)) / 60);
    }
  });

  // Mesai → gün setine dönüştür
  const otDays = new Set<string>(overtimeRows.map(r => r.date?.split('T')[0] ?? ''));

  // İzin → gün bazında ayrıştır (rapor ayrı, diğerleri ayrı)
  const leaveDays  = new Set<string>(); // yıllık + mazeret
  const raporDays  = new Set<string>(); // sağlık raporu
  for (const lv of leaveRows) {
    if (!lv.start_date || !lv.end_date) continue;
    const cur = new Date(lv.start_date);
    const end = new Date(lv.end_date);
    const target = lv.type === 'report' ? raporDays : leaveDays;
    while (cur <= end) {
      target.add(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
  }

  const cells: string[] = [];
  for (let i = 0; i < startDow; i++) cells.push('<div></div>');

  for (let day = 1; day <= totalDays; day++) {
    const date      = new Date(year, mo - 1, day);
    const dow       = (date.getDay() + 6) % 7;
    const isSun     = dow === 6;
    const isFut     = isCurrentMonth && day > todayDay;
    const isToday   = day === todayDay;
    const dateKey   = `${year}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isHoliday = holidayNames.has(dateKey);
    const data      = byDate.get(dateKey);
    const inT       = data?.inT  ?? '';
    const outT      = data?.outT ?? '';
    const hours     = data?.hours ?? 0;
    const hasLog    = !!data;
    const hasOT     = otDays.has(dateKey);
    const hasLeave  = leaveDays.has(dateKey);
    const hasRapor  = raporDays.has(dateKey);

    let cls = 'mv-cal-cell';
    if (isToday)               cls += ' mv-cal-cell--today';
    // İzin/rapor: geleceği de kapsasın — isFut'tan önce kontrol
    else if (hasRapor)         cls += ' mv-cal-cell--rapor';
    else if (hasLeave)         cls += ' mv-cal-cell--leave';
    else if (isFut)            cls += ' mv-cal-cell--future';
    else if (isHoliday && !hasLog) cls += ' mv-cal-cell--holiday';
    else if (isSun && !hasLog) cls += ' mv-cal-cell--sunday';
    else if (hasLog)                cls += ' mv-cal-cell--has-log';
    else                            cls += ' mv-cal-cell--empty-day';
    cls += ' mv-cal-cell--clickable';

    const overtimeBadge = hours > 0
      ? `<span class="mv-cal-badge">${hours.toFixed(1).replace('.0','')}&nbsp;S</span>` : '';
    const holidayName = isHoliday ? (holidayNames.get(dateKey) ?? '') : '';

    cells.push(`
      <div class="${cls}" data-date="${dateKey}">
        <span class="mv-cal-day-num${isSun?' mv-cal-day-num--sun':''}${isToday?' mv-cal-day-num--today':''}${isHoliday?' mv-cal-day-num--holiday':''}">${day}</span>
        ${holidayName && !hasLog ? `<span class="mv-cal-holiday-name">${holidayName}</span>` : ''}
        <div class="mv-cal-content">
          ${inT  ? `<span class="mv-cal-t mv-cal-t--in">${inT}</span>` : ''}
          ${inT && outT ? `<span class="mv-cal-sep">-</span>` : ''}
          ${outT ? `<span class="mv-cal-t mv-cal-t--out">${outT}</span>` : ''}
          ${overtimeBadge}
        </div>
        <div class="mv-cal-dots-row">
          ${inT      ? '<span class="mv-cal-dot mv-cal-dot--in"></span>'    : ''}
          ${outT     ? '<span class="mv-cal-dot mv-cal-dot--out"></span>'   : ''}
          ${hasOT    ? '<span class="mv-cal-dot mv-cal-dot--mesai"></span>' : ''}
          ${hasLeave ? '<span class="mv-cal-dot mv-cal-dot--izin"></span>'  : ''}
          ${hasRapor ? '<span class="mv-cal-dot mv-cal-dot--rapor"></span>' : ''}
        </div>
      </div>
    `);
  }

  return `
    <div class="mv-cal-dow-row">
      ${DAY_LABELS.map(d => `<div class="mv-cal-dow">${d}</div>`).join('')}
    </div>
    <div class="mv-cal-grid" id="mv-cal-grid">${cells.join('')}</div>
    <div class="mv-cal-legend-bottom">
      <span class="mv-legend-item"><span class="mv-legend-dot mv-legend-dot--in"></span>Giriş</span>
      <span class="mv-legend-item"><span class="mv-legend-dot mv-legend-dot--out"></span>Çıkış</span>
      <span class="mv-legend-item"><span class="mv-legend-dot mv-legend-dot--mesai"></span>Mesai</span>
      <span class="mv-legend-item"><span class="mv-legend-dot mv-legend-dot--rapor"></span>Rapor</span>
      <span class="mv-legend-item"><span class="mv-cal-legend-swatch mv-cal-legend-swatch--holiday"></span>Tatil</span>
      <span class="mv-legend-item"><span class="mv-cal-legend-swatch mv-cal-legend-swatch--leave"></span>İzin</span>
    </div>
  `;
}

function calcWorkHours(allRows: AttendanceRow[]): number {
  const byDate = new Map<string, { in: Date | null; out: Date | null }>();
  for (const r of allRows) {
    const d   = new Date(r.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!byDate.has(key)) byDate.set(key, { in: null, out: null });
    const e = byDate.get(key)!;
    if (r.type === 'in'  && (!e.in  || d < e.in))  e.in  = d;
    if (r.type === 'out' && (!e.out || d > e.out))  e.out = d;
  }
  let total = 0;
  byDate.forEach(e => {
    if (e.in && e.out && e.out > e.in)
      total += (e.out.getTime() - e.in.getTime()) / 3600000;
  });
  return Math.round(total * 10) / 10;
}

function currentMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

// ── Alpine bileşeni kaydı ─────────────────────────────────────
Alpine.data('movementsPage', () => ({
  // ── State ──
  role:         '',
  view:         'list' as 'list' | 'detail',
  users:        [] as SimpleUser[],
  userSearch:   '',
  selectedUser: null as SimpleUser | null,
  allRows:      [] as AttendanceRow[],
  overtimeRows: [] as OvertimeRow[],
  leaveRows:    [] as LeaveRow[],
  month:        currentMonth(),
  listPage:     1,
  loading:      false,
  excelLoading:  false,
  bulkMonth:     currentMonth(),
  showManualModal: false,
  alphaCurrent: '' as string,
  alphaDragging: false,
  manualForm: {
    date:   '',
    time:   '',
    type:   'in' as 'in' | 'out',
    userId: '',
  },

  // ── Init ──
  async init() {
    const user = state.get('user') as { id: string; role: string } | null;
    this.role = user?.role ?? 'personel';

    if (this.isPriv) {
      await this.loadUsers();
      // view kalır 'list'
    } else {
      this.view = 'detail';
      await this.loadData();
      // Takvim hücrelerine listener bağla (x-html sonrası)
      this.$nextTick(() => this._bindCalCells());
    }
  },

  // ── Computed ──
  get isPriv(): boolean {
    return this.role === 'admin' || this.role === 'mudur';
  },
  get filteredUsers(): SimpleUser[] {
    const q = this.userSearch.trim().toLocaleLowerCase('tr');
    if (!q) return this.users;
    return this.users.filter((u: SimpleUser) =>
      u.name.toLocaleLowerCase('tr').includes(q) ||
      u.personnel_id.toLocaleLowerCase('tr').includes(q)
    );
  },
  get groupedUsers(): { letter: string; users: SimpleUser[] }[] {
    const map = new Map<string, SimpleUser[]>();
    for (const u of this.filteredUsers) {
      const letter = (u.name[0] ?? '#').toLocaleUpperCase('tr');
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(u);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'tr'))
      .map(([letter, users]) => ({ letter, users }));
  },
  get listRows(): AttendanceRow[] {
    const s = (this.listPage - 1) * LIST_PER_PAGE;
    return this.allRows.slice(s, s + LIST_PER_PAGE);
  },
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.allRows.length / LIST_PER_PAGE));
  },
  get checkins(): number {
    return this.allRows.filter((r: AttendanceRow) => r.type === 'in').length;
  },
  get monthLeaveCount(): number {
    const [y, mo] = this.month.split('-').map(Number);
    const start = `${y}-${String(mo).padStart(2,'0')}-01`;
    const end   = `${y}-${String(mo).padStart(2,'0')}-${new Date(y, mo, 0).getDate()}`;
    return (this.leaveRows as LeaveRow[]).filter(r =>
      r.status === 'approved' &&
      r.start_date?.split('T')[0] <= end &&
      r.end_date?.split('T')[0]   >= start
    ).reduce((acc, r) => acc + (r.days ?? 0), 0);
  },
  get workHours(): number {
    return calcWorkHours(this.allRows);
  },
  get monthLabel(): string {
    const [yr, mo] = this.month.split('-').map(Number);
    return new Date(yr, mo - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  },
  // Takvim HTML — x-html ile render edilir (user input değil, hesaplanmış)
  get calendarHTML(): string {
    const [y] = this.month.split('-').map(Number);
    const names = getHolidayNamesSync(y); // preload sonrası sync erişim
    return buildCalendar(this.month, this.allRows, this.isPriv, this.overtimeRows, this.leaveRows, names);
  },
  get recordsHTML(): string {
    return this._buildRecordsHTML();
  },

  // ── Veri yükleyiciler ──
  async loadUsers() {
    try {
      const res = await api.get<{ users: SimpleUser[] }>('/api/v1/users?perPage=200');
      this.users = res.users ?? [];
    } catch { this.users = []; }
  },

  async loadData() {
    this.loading = true;
    // Takvim için o ayın yılının tatillerini önceden yükle
    const [y] = this.month.split('-').map(Number);
    await preload([y]);
    try {
      const uid = this.selectedUser?.id;
      const attParams = new URLSearchParams({ page: '1', limit: '500', month: this.month });
      if (uid) attParams.set('userId', uid);

      const [attRes, otRes, lvRes] = await Promise.all([
        api.get<{ rows: AttendanceRow[] }>(`/api/v1/attendance?${attParams}`),
        api.get<{ rows: OvertimeRow[] }>(`/api/v1/overtime?limit=200${uid ? '&userId=' + uid : ''}`).catch(() => ({ rows: [] })),
        api.get<{ rows: LeaveRow[] }>(`/api/v1/leaves?limit=200${uid ? '&userId=' + uid : ''}`).catch(() => ({ rows: [] })),
      ]);
      this.allRows      = attRes.rows ?? [];
      this.overtimeRows = otRes.rows  ?? [];
      this.leaveRows    = lvRes.rows  ?? [];
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yüklenemedi', 'error');
      this.allRows = [];
    } finally {
      this.loading = false;
      this.$nextTick(() => this._bindCalCells());
    }
  },

  // ── Navigasyon ──
  async selectUser(userId: string) {
    this.selectedUser = this.users.find((u: SimpleUser) => u.id === userId) ?? null;
    this.view         = 'detail';
    this.listPage     = 1;
    this.allRows      = [];
    await this.loadData();
  },

  goBack() {
    this.view         = 'list';
    this.selectedUser = null;
    this.allRows      = [];
  },

  async shiftMonth(dir: -1 | 1) {
    const [y, m] = this.month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    this.month    = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.listPage = 1;
    await this.loadData();
  },

  async changeMonth(val: string) {
    this.month    = val;
    this.listPage = 1;
    await this.loadData();
  },

  // ── Pagination ──
  prevPage() {
    if (this.listPage > 1) this.listPage--;
  },
  nextPage() {
    if (this.listPage < this.totalPages) this.listPage++;
  },

  // ── Toplu Excel (tüm personel, kişi başı sheet) ──
  async exportBulkExcel() {
    this.excelLoading = true;
    try {
      const params = new URLSearchParams({ month: this.bulkMonth });
      const res = await fetch(`/api/v1/reports/excel/attendance?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Rapor alınamadı');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `devam-raporu-tum-${this.bulkMonth}.xlsx`,
      });
      a.click();
      URL.revokeObjectURL(url);
      Toast.show('Toplu Excel indirildi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'İndirilemedi', 'error');
    } finally {
      this.excelLoading = false;
    }
  },

  // ── Tekil Excel indirme ──
  async exportExcel() {
    this.excelLoading = true;
    try {
      const params = new URLSearchParams({ month: this.month });
      if (this.selectedUser) params.set('userId', this.selectedUser.id);
      const res = await fetch(`/api/v1/reports/excel/attendance?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Rapor alınamadı');
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const filename = `devam-raporu-${this.selectedUser?.name ?? 'tum'}-${this.month}.xlsx`;
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      a.click();
      URL.revokeObjectURL(url);
      Toast.show('Excel raporu indirildi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'İndirilemedi', 'error');
    } finally {
      this.excelLoading = false;
    }
  },

  // ── Takvim hücre tıklama bağlantısı ──
  _bindCalCells() {
    const grid = document.getElementById('mv-cal-grid');
    if (!grid) return;
    grid.querySelectorAll<HTMLElement>('.mv-cal-cell--clickable').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        if (!date) return;
        const rows = this.allRows.filter((r: AttendanceRow) => r.timestamp.startsWith(date));
        this._openDayModal(date, rows);
      });
    });
  },

  // ── Kayıt listesi HTML oluşturma ──
  _buildRecordsHTML(): string {
    const rows = this.listRows;
    if (rows.length === 0) return '<p class="mv-empty" style="padding:32px">Bu ay için kayıt bulunamadı.</p>';

    const tableRows = rows.map((r: AttendanceRow) => {
      const dt      = new Date(r.timestamp);
      const dateStr = dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const isIn    = r.type === 'in';
      const badge   = `<span class="mv-type-badge ${isIn ? 'mv-type-badge--in' : 'mv-type-badge--out'}">${isIn ? 'Giriş' : 'Çıkış'}</span>`;
      const actions = this.isPriv ? `
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
          <button class="mv-act-btn mv-act-btn--edit" data-act="edit" data-id="${r.id}" title="Düzenle">${I_EDIT}</button>
          <button class="mv-act-btn mv-act-btn--del"  data-act="del"  data-id="${r.id}" title="Sil">${I_TRASH}</button>
        </div>` : '';
      return `
        <tr>
          <td><span class="mv-date">${dateStr}, ${timeStr}</span></td>
          <td>${badge}</td>
          <td class="mv-ip">${r.ip_address ?? '—'}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');

    const mobileCards = rows.map((r: AttendanceRow) => {
      const dt      = new Date(r.timestamp);
      const dateStr = dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const isIn    = r.type === 'in';
      return `
        <div class="mv-mobile-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span class="mv-type-badge ${isIn ? 'mv-type-badge--in' : 'mv-type-badge--out'}">${isIn ? 'Giriş' : 'Çıkış'}</span>
            ${this.isPriv ? `
            <div style="display:flex;gap:6px">
              <button class="mv-act-btn mv-act-btn--edit" data-act="edit" data-id="${r.id}">${I_EDIT}</button>
              <button class="mv-act-btn mv-act-btn--del"  data-act="del"  data-id="${r.id}">${I_TRASH}</button>
            </div>` : ''}
          </div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between">
            <div>
              <p style="font-size:11px;font-weight:700;color:var(--text-secondary)">${dateStr}</p>
              <p style="font-size:22px;font-weight:900;color:var(--text-primary);line-height:1.1">${timeStr}</p>
            </div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace;font-style:italic">${r.ip_address ?? '—'}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="mv-records-table-wrap">
        <table class="mv-records-table">
          <thead>
            <tr>
              <th>Tarih / Saat</th>
              <th>İşlem</th>
              <th>Kaynak</th>
              <th style="text-align:right">İşlem</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="mv-records-mobile">${mobileCards}</div>
    `;
  },

  // ── Kayıt aksiyon event delegation ──
  handleRecordAction(event: Event) {
    const btn = (event.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
    if (!btn) return;
    const act = btn.dataset.act!;
    const id  = btn.dataset.id!;
    if (act === 'edit') {
      const row = this.allRows.find((r: AttendanceRow) => r.id === id);
      if (row) this._openManualModal('', row);
    } else if (act === 'del') {
      this._deleteRecord(id);
    }
  },

  async _deleteRecord(id: string) {
    const ok = await Modal.confirm({
      title:       'Kaydı Sil',
      content:     'Bu giriş/çıkış kaydı kalıcı olarak silinecek. Devam edilsin mi?',
      confirmText: 'Evet, Sil',
      cancelText:  'Vazgeç',
      danger:      true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/attendance/${id}`);
      Toast.show('Kayıt silindi', 'success');
      await this.loadData();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error');
    }
  },

  // ── Gün Modalı (overlay DOM) ──
  _openDayModal(dateKey: string, rows: AttendanceRow[]) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const u = this.selectedUser;
    const personName = u
      ? u.name
      : (state.get('profile') as { name?: string } | null)?.name ?? 'Personel';

    // O güne ait mesai kayıtları
    const dayOT = (this.overtimeRows as OvertimeRow[]).filter(r => {
      const rDate = (r.date ?? '').split('T')[0];
      return rDate === dateKey;
    });

    // O günü kapsayan izin kayıtları
    const TYPE_LABELS: Record<string, string> = { annual: 'Yıllık İzin', report: 'Sağlık Raporu', excuse: 'Mazeret İzni' };
    const dayLeaves = (this.leaveRows as LeaveRow[]).filter(r => {
      if (!r.start_date || !r.end_date) return false;
      return dateKey >= r.start_date.split('T')[0] && dateKey <= r.end_date.split('T')[0];
    });

    const overlay = document.createElement('div');
    overlay.className = 'mv-day-overlay';
    overlay.innerHTML = `
      <div class="mv-day-modal">
        <div class="mv-day-modal-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="mv-user-avatar" style="width:40px;height:40px;flex-shrink:0;${u?.avatar_path ? 'padding:0;overflow:hidden' : ''}">
              ${renderAvatar(personName, u?.avatar_path, 40)}
            </div>
            <div>
              <h3 style="font-size:18px;font-weight:800;color:var(--text-primary)">${dateLabel}</h3>
              <p style="font-size:12px;color:var(--text-muted);margin-top:2px">${personName} Hareketleri</p>
            </div>
          </div>
          <button class="mv-day-close" id="mv-day-close">
            <span style="color:var(--text-muted)">${I_X}</span>
          </button>
        </div>
        <div class="mv-day-body">
          ${this.isPriv ? `<button class="mv-day-add-btn" id="mv-day-add">${I_PLUS} Manuel Hareket Ekle</button>` : ''}

          <!-- Giriş/Çıkış -->
          <div class="mv-day-section">
            <h4 class="mv-day-section-title">
              <span style="color:#4ade80">${I_LOGIN}</span> Giriş-Çıkış
            </h4>
            ${rows.length === 0
              ? '<p class="mv-day-empty">Bu gün için giriş/çıkış kaydı yok.</p>'
              : rows.map(r => {
                  const t = new Date(r.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  const isIn = r.type === 'in';
                  return `
                    <div class="mv-day-log-item ${isIn ? 'mv-day-log-item--in' : 'mv-day-log-item--out'}">
                      <div style="display:flex;align-items:center;gap:12px">
                        <span style="color:${isIn ? '#4ade80' : 'var(--accent)'}">${isIn ? I_IN : I_OUT}</span>
                        <div>
                          <p style="font-size:11px;font-weight:600;color:var(--text-muted)">${isIn ? 'Giriş' : 'Çıkış'}</p>
                          <p style="font-size:22px;font-weight:900;line-height:1;color:${isIn ? '#4ade80' : 'var(--accent)'}">${t}</p>
                        </div>
                      </div>
                      <span style="font-size:11px;color:var(--text-muted);font-family:monospace">${r.ip_address ?? '—'}</span>
                    </div>`;
                }).join('')}
          </div>

          <!-- Mesai -->
          <div class="mv-day-section">
            <h4 class="mv-day-section-title">
              <span style="color:#60a5fa">${I_CLOCK}</span> Fazla Mesai
            </h4>
            ${dayOT.length === 0
              ? '<p class="mv-day-empty">Bu gün için mesai kaydı yok.</p>'
              : dayOT.map(r => `
                <div class="mv-day-log-item" style="border-left:3px solid #60a5fa">
                  <div>
                    <p style="font-size:13px;font-weight:700;color:#60a5fa">${r.hours} Saat Fazla Mesai</p>
                    ${r.description ? `<p style="font-size:12px;color:var(--text-muted);margin-top:2px">${r.description}</p>` : ''}
                  </div>
                  <span class="badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-error' : 'badge-warning'}" style="font-size:10px">
                    ${r.status === 'approved' ? 'Onaylı' : r.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                </div>`).join('')}
          </div>

          <!-- İzin -->
          <div class="mv-day-section">
            <h4 class="mv-day-section-title">
              <span style="color:#eab308">${I_FILE}</span> İzin / Rapor
            </h4>
            ${dayLeaves.length === 0
              ? '<p class="mv-day-empty">Bu gün için izin kaydı yok.</p>'
              : dayLeaves.map(r => {
                  const isRapor = r.type === 'report';
                  const color   = isRapor ? '#a78bfa' : '#eab308'; // mor : amber
                  return `
                <div class="mv-day-log-item" style="border-left:3px solid ${color}">
                  <div>
                    <p style="font-size:13px;font-weight:700;color:${color}">${TYPE_LABELS[r.type] ?? r.type}</p>
                    <p style="font-size:11px;color:var(--text-muted);margin-top:2px">
                      ${new Date(r.start_date).toLocaleDateString('tr-TR')} – ${new Date(r.end_date).toLocaleDateString('tr-TR')} (${r.days} gün)
                    </p>
                  </div>
                  <span class="badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-error' : 'badge-warning'}" style="font-size:10px">
                    ${r.status === 'approved' ? 'Onaylı' : r.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                </div>`;
                }).join('')}
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e: Event) => { if (e.target === overlay) close(); });
    overlay.querySelector('#mv-day-close')?.addEventListener('click', close);
    overlay.querySelector('#mv-day-add')?.addEventListener('click', () => {
      close();
      this._openManualModal(dateKey);
    });
  },

  // ── Alphabet scroll bar ──
  _mountAlphaBar(el: HTMLElement) {
    // passive:false zorunlu — yoksa tarayıcı preventDefault() çağrısını yok sayar ve scroll devam eder
    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove',  (e) => e.preventDefault(), { passive: false });
  },

  _alphaHit(e: Event) {
    const pe  = e as PointerEvent;
    const bar = pe.currentTarget as HTMLElement;
    if (pe.type === 'pointerdown') bar.setPointerCapture(pe.pointerId);
    const rect = bar.getBoundingClientRect();
    const y    = Math.max(0, Math.min(rect.height, pe.clientY - rect.top));
    const letters = (this.groupedUsers as { letter: string }[]).map(g => g.letter);
    if (!letters.length) return;
    const idx    = Math.min(letters.length - 1, Math.floor((y / rect.height) * letters.length));
    const letter = letters[idx];
    if (letter === this.alphaCurrent) return;
    this.alphaCurrent = letter;
    if ('vibrate' in navigator) navigator.vibrate(8);
    const el = document.getElementById('mv-group-' + letter);
    if (el) {
      const top = window.scrollY + el.getBoundingClientRect().top - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }
  },

  // ── Manuel Kayıt / Düzenleme Modalı (overlay DOM) ──
  _openManualModal(dateKey: string, existingRow?: AttendanceRow) {
    const isEdit   = !!existingRow;
    const dt       = existingRow ? new Date(existingRow.timestamp) : null;
    const initDate = dt
      ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      : (dateKey || new Date().toISOString().split('T')[0]);
    const initTime = dt
      ? dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const initType    = existingRow?.type ?? 'in';
    const userId      = this.selectedUser?.id ?? '';
    const personName  = this.selectedUser?.name
      ?? (state.get('profile') as { name?: string } | null)?.name ?? '';

    const overlay = document.createElement('div');
    overlay.className = 'mv-day-overlay';
    overlay.innerHTML = `
      <div class="mv-manual-modal">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px">
          <div>
            <h3 style="font-size:20px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px">
              ${I_CLOCK} ${isEdit ? 'Kaydı Düzenle' : 'Manuel Kayıt Ekle'}
            </h3>
            ${personName ? `<p style="font-size:12px;color:var(--text-muted);margin-top:4px">
              Personel: <span style="color:var(--accent);font-weight:700">${personName}</span>
            </p>` : ''}
          </div>
          <button id="mm-close" style="background:transparent;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
            ${I_X}
          </button>
        </div>
        <form id="mm-form" style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label class="mv-manual-label">Tarih</label>
            <input class="mv-manual-input" name="date" type="date" value="${initDate}" required />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label class="mv-manual-label">Saat</label>
            <input class="mv-manual-input" name="time" type="time" value="${initTime}" required />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label class="mv-manual-label">İşlem Tipi</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <button type="button" class="mv-type-btn ${initType === 'in' ? 'mv-type-btn--in-active' : 'mv-type-btn--idle'}" data-t="in">Giriş</button>
              <button type="button" class="mv-type-btn ${initType === 'out' ? 'mv-type-btn--out-active' : 'mv-type-btn--idle'}" data-t="out">Çıkış</button>
            </div>
            <input type="hidden" name="type" id="mm-type" value="${initType}" />
          </div>
          <div style="display:flex;gap:8px;padding-top:8px">
            ${isEdit ? `<button type="button" class="mv-del-btn" id="mm-del">Sil</button>` : ''}
            <button type="submit" class="mv-submit-btn" id="mm-submit">
              ${isEdit ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e: Event) => { if (e.target === overlay) close(); });
    overlay.querySelector('#mm-close')?.addEventListener('click', close);

    // Tip seçimi
    overlay.querySelectorAll<HTMLElement>('[data-t]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.t!;
        overlay.querySelectorAll<HTMLElement>('[data-t]').forEach(b => {
          b.className = 'mv-type-btn mv-type-btn--idle';
        });
        btn.className = `mv-type-btn ${t === 'in' ? 'mv-type-btn--in-active' : 'mv-type-btn--out-active'}`;
        (overlay.querySelector('#mm-type') as HTMLInputElement).value = t;
      });
    });

    // Sil (edit modda)
    overlay.querySelector('#mm-del')?.addEventListener('click', async () => {
      const ok = await Modal.confirm({
        title:       'Kaydı Sil',
        content:     'Bu giriş/çıkış kaydı kalıcı olarak silinecek. Devam edilsin mi?',
        confirmText: 'Evet, Sil',
        cancelText:  'Vazgeç',
        danger:      true,
      });
      if (!ok) return;
      try {
        await api.delete(`/api/v1/attendance/${existingRow!.id}`);
        Toast.show('Kayıt silindi', 'success');
        close();
        await this.loadData();
      } catch (err: unknown) {
        Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error');
      }
    });

    const form = overlay.querySelector('#mm-form') as HTMLFormElement;
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const fd  = new FormData(form);
      const btn = overlay.querySelector<HTMLButtonElement>('#mm-submit')!;
      btn.disabled = true; btn.textContent = isEdit ? 'Güncelleniyor...' : 'Kaydediliyor...';
      try {
        if (isEdit) {
          await api.patch(`/api/v1/attendance/${existingRow!.id}`, {
            type: fd.get('type'), date: fd.get('date'), time: fd.get('time'),
          });
          Toast.show('Kayıt güncellendi', 'success');
        } else {
          const selfId = (state.get('user') as { id: string } | null)?.id ?? '';
          await api.post('/api/v1/attendance/manual', {
            userId: userId || selfId,
            type: fd.get('type'), date: fd.get('date'), time: fd.get('time'),
          });
          Toast.show('Manuel kayıt eklendi', 'success');
        }
        close();
        await this.loadData();
      } catch (err: unknown) {
        Toast.show(err instanceof Error ? err.message : 'İşlem başarısız', 'error');
        btn.disabled = false;
        btn.textContent = isEdit ? 'Güncelle' : 'Kaydet';
      }
    });
  },
}));

// ── Sayfa sınıfı ─────────────────────────────────────────────
export class MovementsPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="movements-page" x-data="movementsPage()" x-init="init()">

        <!-- ═══════════════ PERSONEL LİSTESİ ═══════════════ -->
        <template x-if="view === 'list'">
          <div>
            <div class="page-header" style="margin-bottom:16px">
              <h2 class="page-title">${I_CAL} Hareket Kontrol</h2>
            </div>
            <!-- Toplu Excel indirme -->
            <div class="mv-bulk-bar">
              <div class="mv-bulk-label">
                ${I_DOWN} Tüm personeli Excel'e aktar
              </div>
              <div class="mv-bulk-controls">
                <input class="mv-month-input mv-bulk-month" type="month"
                  x-model="bulkMonth"
                  title="Rapor ayı seç" />
                <button class="mv-excel-btn" :disabled="excelLoading" @click="exportBulkExcel()">
                  ${I_DOWN}
                  <span x-text="excelLoading ? 'İndiriliyor...' : 'Toplu Excel'"></span>
                </button>
              </div>
            </div>

            <div class="mv-search-wrap">
              <span class="mv-search-ico">${I_SEARCH}</span>
              <input
                class="mv-search-input"
                type="search"
                placeholder="Ad veya personel ID ara..."
                x-model="userSearch"
                autocomplete="off"
              />
            </div>
            <template x-if="filteredUsers.length === 0">
              <p style="text-align:center;color:var(--text-muted);padding:48px 0">
                Personel bulunamadı.
              </p>
            </template>
            <template x-for="group in groupedUsers" :key="group.letter">
              <div :id="'mv-group-' + group.letter">
                <div class="mv-group-label" x-text="group.letter"></div>
                <div class="mv-user-grid">
                  <template x-for="u in group.users" :key="u.id">
                    <button class="mv-user-card" @click="selectUser(u.id)">
                      <div style="display:flex;align-items:center;gap:12px">
                        <div class="mv-user-avatar" :style="u.avatar_path ? 'padding:0;overflow:hidden' : ''">
                          <template x-if="u.avatar_path">
                            <img :src="u.avatar_path" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
                          </template>
                          <template x-if="!u.avatar_path">
                            <span x-text="u.name[0]?.toUpperCase() ?? '?'"></span>
                          </template>
                        </div>
                        <div style="text-align:left">
                          <p style="font-weight:700;font-size:14px;color:var(--text-primary)" x-text="u.name"></p>
                          <p style="font-size:12px;color:var(--text-muted)" x-text="u.personnel_id"></p>
                        </div>
                      </div>
                      <span style="color:rgba(255,255,255,0.2);flex-shrink:0">${I_CHEVR}</span>
                    </button>
                  </template>
                </div>
              </div>
            </template>

            <!-- Alphabet scroll bar -->
            <div class="mv-alpha-bar"
              x-init="_mountAlphaBar($el)"
              @pointerdown.prevent="alphaDragging=true;_alphaHit($event)"
              @pointermove="if(alphaDragging)_alphaHit($event)"
              @pointerup="alphaDragging=false;alphaCurrent=''"
              @pointercancel="alphaDragging=false;alphaCurrent=''">
              <template x-for="g in groupedUsers" :key="g.letter">
                <span class="mv-alpha-letter"
                  :class="alphaCurrent===g.letter?'mv-alpha-letter--active':''"
                  x-text="g.letter"></span>
              </template>
            </div>

            <!-- Alphabet bubble (merkez göstergesi) -->
            <div class="mv-alpha-bubble" x-show="alphaCurrent" x-cloak x-text="alphaCurrent"></div>

          </div>
        </template>

        <!-- ═══════════════ DETAY GÖRÜNÜMÜ ═══════════════ -->
        <template x-if="view === 'detail'">
          <div class="mv-detail-wrap">

            <!-- Üst kontroller: Geri + Excel + Ay seçici -->
            <div class="mv-top-bar">
              <template x-if="isPriv">
                <button class="mv-back-btn" @click="goBack()">
                  ${I_BACK} Geri Dön
                </button>
              </template>
              <template x-if="!isPriv">
                <div></div>
              </template>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <template x-if="isPriv">
                  <button class="mv-excel-btn" :disabled="excelLoading" @click="exportExcel()">
                    ${I_DOWN}
                    <span class="mv-excel-label" x-text="excelLoading ? 'İndiriliyor...' : 'Excel\\'e Aktar'"></span>
                  </button>
                </template>
                <div class="mv-month-nav">
                  <button class="mv-month-btn" @click="shiftMonth(-1)">${I_PREV}</button>
                  <input class="mv-month-input" type="month"
                    :value="month"
                    @change="changeMonth($event.target.value)" />
                  <button class="mv-month-btn" @click="shiftMonth(1)">${I_NEXT}</button>
                </div>
              </div>
            </div>

            <!-- Başlık kartı -->
            <div class="mv-detail-header-card">
              <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                <div class="mv-detail-avatar"
                  :style="selectedUser?.avatar_path ? 'padding:0;overflow:hidden' : ''">
                  ${alpineAvatar('selectedUser?.avatar_path', 'selectedUser?.name')}
                </div>
                <div style="flex:1">
                  <h3 class="mv-detail-title"
                    x-text="selectedUser ? selectedUser.name : 'Giriş Çıkış Hareketlerim'"></h3>
                  <p class="mv-detail-subtitle" x-text="monthLabel"></p>
                </div>
                <template x-if="isPriv">
                  <button class="mv-manual-btn"
                    @click="_openManualModal(new Date().toISOString().split('T')[0])">
                    ${I_PLUS} Manuel Kayıt Ekle
                  </button>
                </template>
              </div>
            </div>

            <!-- Özet istatistikler -->
            <div class="mv-stats-grid">
              <div class="mv-stat-card">
                <p class="mv-stat-label">Aylık Toplam Mesai</p>
                <p class="mv-stat-value mv-stat-value--blue">
                  <span x-text="workHours.toFixed(1)"></span><span class="mv-stat-unit"> Saat</span>
                </p>
              </div>
              <div class="mv-stat-card">
                <p class="mv-stat-label">Aylık Toplam İzin</p>
                <p class="mv-stat-value mv-stat-value--orange">
                  <span x-text="monthLeaveCount"></span><span class="mv-stat-unit"> Gün</span>
                </p>
              </div>
              <div class="mv-stat-card">
                <p class="mv-stat-label">Giriş Kaydı Sayısı</p>
                <p class="mv-stat-value mv-stat-value--green">
                  <span x-text="checkins"></span><span class="mv-stat-unit"> Kez</span>
                </p>
              </div>
            </div>

            <!-- Takvim — x-html ile render edilir (hesaplanmış HTML, user input değil) -->
            <div class="mv-calendar-card">
              <div class="mv-calendar-section" x-html="calendarHTML"></div>
            </div>

            <!-- Kayıt Listesi -->
            <div>
              <h4 class="mv-records-title">
                ${I_CLOCK} Tüm Giriş/Çıkış Kayıtları
                <span class="mv-records-month">(<span x-text="monthLabel"></span>)</span>
              </h4>
              <!-- event delegation ile edit/del aksiyonları -->
              <div class="mv-records-wrap"
                x-html="recordsHTML"
                @click="handleRecordAction($event)"></div>

              <!-- Pagination -->
              <template x-if="totalPages > 1">
                <div class="mv-pagination">
                  <button class="mv-page-btn"
                    :disabled="listPage <= 1"
                    @click="prevPage()">${I_PREV}</button>
                  <span class="mv-page-info">
                    <span x-text="listPage"></span> /
                    <span x-text="totalPages"></span>
                    <span class="mv-page-total">
                      (<span x-text="allRows.length"></span> kayıt)
                    </span>
                  </span>
                  <button class="mv-page-btn"
                    :disabled="listPage >= totalPages"
                    @click="nextPage()">${I_NEXT}</button>
                </div>
              </template>
            </div>

          </div>
        </template>

      </div>
    `;
  }
}
