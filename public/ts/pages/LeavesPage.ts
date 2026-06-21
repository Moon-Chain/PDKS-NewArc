import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import { getHolidaySet, preload } from '../core/HolidayCache.js';

interface LeaveRow {
  id: string; user_id: string; user_name: string;
  start_date: string; end_date: string; days: number;
  reason: string; type: 'annual' | 'report' | 'excuse';
  status: 'pending' | 'approved' | 'rejected'; created_at: string;
}

interface Profile {
  id: string; name: string; role: string;
  leave_balance: number; manager_id?: string;
}

interface OvertimeRow {
  id: string; user_id: string; user_name: string;
  date: string; hours: number; description: string | null; status: string;
}

const TYPE_LABELS: Record<string, string> = {
  annual: 'Yıllık İzin', report: 'Rapor', excuse: 'Mazeret İzni',
};

function workDays(s: string, e: string, holidaySet: Set<string>): number {
  const start = new Date(s), end = new Date(e);
  if (end < start) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const iso = cur.toISOString().split('T')[0];
    const dow = cur.getDay();
    // Pazar=0 ve Cumartesi=6 hariç (5 günlük çalışma haftası)
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, n);
}

// ── SVG ikonlar ──────────────────────────────────────────────
const I_FILE   = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
const I_PLUS   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const I_CHECK  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const I_X_SM   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const I_X      = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const I_EDIT   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const I_TRASH  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const I_TRASH2 = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const I_DOWN   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

// ── Alpine bileşeni kaydı ────────────────────────────────────
Alpine.data('leavesPage', () => ({
  // ── State ──
  profile:      null as Profile | null,
  rows:         [] as LeaveRow[],
  overtimes:    [] as OvertimeRow[],
  leaveBal:     0,
  pendingCount: 0,
  loadingRows:  true,
  loadingOT:    true,

  form: {
    type:      'annual',
    startDate: new Date().toISOString().split('T')[0],
    endDate:   new Date().toISOString().split('T')[0],
    days:      1,
    reason:    '',
  },

  otForm: {
    date:        new Date().toISOString().split('T')[0],
    startTime:   '',
    endTime:     '',
    hours:       '' as string | number,
    description: '',
  },

  leaveSubmitting: false,
  otSubmitting:    false,
  excelLoading:    false,

  // ── İnit ──
  async init() {
    this.profile  = state.get('profile') as Profile | null;
    this.leaveBal = this.profile?.leave_balance ?? 0;
    // Mevcut yıl ve gelecek yıl tatillerini önceden yükle
    const cy = new Date().getFullYear();
    await Promise.all([
      preload([cy, cy + 1]),
      this.loadLeaves(),
      this.loadOvertime(),
    ]);
  },

  // ── Computed ──
  get isPriv(): boolean {
    return ['admin', 'mudur', 'takim_lideri'].includes(this.profile?.role ?? '');
  },
  get isAdmin(): boolean {
    return this.profile?.role === 'admin';
  },
  get isAdminOrMudur(): boolean {
    return this.profile?.role === 'admin' || this.profile?.role === 'mudur';
  },
  get userId(): string {
    return (state.get('user') as { id: string } | null)?.id ?? '';
  },

  // ── İzin iş günü hesabı ──
  async calcDays() {
    const s = new Date(this.form.startDate);
    const e = new Date(this.form.endDate);
    // Her iki tarihin yılındaki tatilleri çek ve birleştir
    const years = [...new Set([s.getFullYear(), e.getFullYear()])];
    const sets  = await Promise.all(years.map(y => getHolidaySet(y)));
    const merged = new Set(sets.flatMap(s2 => [...s2]));
    this.form.days = workDays(this.form.startDate, this.form.endDate, merged);
  },

  // ── Mesai saat hesabı ──
  calcOtHours() {
    const s = this.otForm.startTime;
    const e = this.otForm.endTime;
    if (s && e) {
      const [sh, sm] = s.split(':').map(Number);
      const [eh, em] = e.split(':').map(Number);
      const diff = Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
      this.otForm.hours = diff > 0 ? parseFloat(diff.toFixed(1)) : '';
    }
  },

  // ── Yükleyiciler ──
  async loadLeaves() {
    this.loadingRows = true;
    try {
      const res = await api.get<{ rows: LeaveRow[]; total: number }>('/api/v1/leaves?limit=50');
      this.rows         = res.rows ?? [];
      this.pendingCount = this.rows.filter(r => r.status === 'pending').length;
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yüklenemedi', 'error');
    } finally {
      this.loadingRows = false;
    }
  },

  async loadOvertime() {
    this.loadingOT = true;
    try {
      const res = await api.get<{ rows: OvertimeRow[] }>('/api/v1/overtime?limit=50');
      this.overtimes = res.rows ?? [];
    } catch { /* sessiz fail */ } finally {
      this.loadingOT = false;
    }
  },

  // ── Yardımcı ──
  badgeClass(status: string): string {
    return status === 'pending' ? 'lv-badge--pending'
         : status === 'approved' ? 'lv-badge--approved'
         : 'lv-badge--rejected';
  },
  badgeText(status: string): string {
    return status === 'pending' ? 'Bekliyor'
         : status === 'approved' ? 'Onaylandı'
         : 'Reddedildi';
  },
  typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
  },
  fmtDateRange(start: string, end: string): string {
    const s = new Date(start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const e = new Date(end  ).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} - ${e}`;
  },
  fmtDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  // ── İzin formu gönder ──
  async submitLeave() {
    this.leaveSubmitting = true;
    try {
      await api.post('/api/v1/leaves', {
        type:       this.form.type,
        start_date: this.form.startDate,
        end_date:   this.form.endDate,
        reason:     this.form.reason,
      });
      Toast.show('Talep gönderildi', 'success');
      this.form.reason    = '';
      this.form.startDate = new Date().toISOString().split('T')[0];
      this.form.endDate   = new Date().toISOString().split('T')[0];
      this.form.days      = 1;
      this.form.type      = 'annual';
      await this.loadLeaves();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Gönderilemedi', 'error');
    } finally {
      this.leaveSubmitting = false;
    }
  },

  // ── Mesai formu gönder ──
  async submitOt() {
    this.otSubmitting = true;
    try {
      await api.post('/api/v1/overtime', {
        date:        this.otForm.date,
        hours:       parseFloat(String(this.otForm.hours)),
        description: this.otForm.description,
      });
      Toast.show('Mesai talebi gönderildi', 'success');
      this.otForm.date        = new Date().toISOString().split('T')[0];
      this.otForm.startTime   = '';
      this.otForm.endTime     = '';
      this.otForm.hours       = '';
      this.otForm.description = '';
      await this.loadOvertime();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Gönderilemedi', 'error');
    } finally {
      this.otSubmitting = false;
    }
  },

  // ── İzin aksiyonları ──
  async approveLeave(id: string) {
    try {
      await api.patch(`/api/v1/leaves/${id}/approve`);
      Toast.show('Talep onaylandı', 'success');
      await this.loadLeaves();
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Hata', 'error'); }
  },

  async rejectLeave(id: string) {
    try {
      await api.patch(`/api/v1/leaves/${id}/reject`);
      Toast.show('Talep reddedildi', 'success');
      await this.loadLeaves();
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Hata', 'error'); }
  },

  async cancelLeave(id: string) {
    const ok = await Modal.confirm({
      title: 'Talebi İptal Et',
      content: 'Bu izin talebi iptal edilecek. Devam edilsin mi?',
      confirmText: 'Evet, İptal Et', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/api/v1/leaves/${id}/cancel`);
      Toast.show('Talep iptal edildi', 'success');
      await this.loadLeaves();
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Hata', 'error'); }
  },

  async cancelOt(id: string) {
    const ok = await Modal.confirm({
      title: 'Mesai Talebini İptal Et',
      content: 'Bu fazla mesai talebi iptal edilecek. Devam edilsin mi?',
      confirmText: 'Evet, İptal Et', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/api/v1/overtime/${id}/cancel`);
      Toast.show('İptal edildi', 'success');
      await this.loadOvertime();
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Hata', 'error'); }
  },

  // ── Admin: Edit Modal (overlay DOM) ──
  openEditModal(id: string) {
    const row = this.rows.find((r: LeaveRow) => r.id === id);
    if (!row) return;

    const overlay = document.createElement('div');
    overlay.className = 'lv-overlay';
    overlay.innerHTML = `
      <div class="lv-modal">
        <div class="lv-modal-header">
          <h3 class="lv-modal-title">İzin Talebini Düzenle</h3>
          <button class="lv-modal-close" id="em-close">${I_X}</button>
        </div>
        <form id="em-form" style="display:flex;flex-direction:column;gap:16px">
          <div class="lv-grid-2">
            <div class="lv-field">
              <label class="lv-label">Başlangıç</label>
              <input class="lv-input" name="start_date" type="date" required value="${row.start_date.split('T')[0]}" />
            </div>
            <div class="lv-field">
              <label class="lv-label">Bitiş</label>
              <input class="lv-input" name="end_date" type="date" required value="${row.end_date.split('T')[0]}" />
            </div>
          </div>
          <div class="lv-field">
            <label class="lv-label">Gün Sayısı</label>
            <input class="lv-input" name="days" type="number" required value="${row.days}" />
          </div>
          <div class="lv-field">
            <label class="lv-label">Durum</label>
            <select class="lv-input" name="status">
              <option value="pending"  ${row.status === 'pending'  ? 'selected' : ''}>Bekliyor</option>
              <option value="approved" ${row.status === 'approved' ? 'selected' : ''}>Onaylandı</option>
              <option value="rejected" ${row.status === 'rejected' ? 'selected' : ''}>Reddedildi</option>
            </select>
          </div>
          <div class="lv-field">
            <label class="lv-label">Açıklama</label>
            <textarea class="lv-input lv-textarea" name="reason" required>${row.reason}</textarea>
          </div>
          <div style="display:flex;gap:8px">
            <button type="button" class="lv-modal-del-btn" id="em-del">Sil</button>
            <button type="submit" class="lv-modal-save-btn" id="em-save">Güncelle</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e: Event) => { if (e.target === overlay) close(); });
    overlay.querySelector('#em-close')?.addEventListener('click', close);
    overlay.querySelector('#em-del')?.addEventListener('click', () => {
      close(); this.openDeleteModal(id);
    });

    const form = overlay.querySelector('#em-form') as HTMLFormElement;
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const fd  = new FormData(form);
      const btn = overlay.querySelector<HTMLButtonElement>('#em-save')!;
      btn.disabled = true; btn.textContent = 'Güncelleniyor...';
      try {
        const status = fd.get('status') as string;
        if (status === 'approved' && row.status !== 'approved')
          await api.patch(`/api/v1/leaves/${row.id}/approve`);
        else if (status === 'rejected' && row.status !== 'rejected')
          await api.patch(`/api/v1/leaves/${row.id}/reject`);
        Toast.show('Güncellendi', 'success');
        close();
        await this.loadLeaves();
      } catch (err: unknown) {
        Toast.show(err instanceof Error ? err.message : 'Güncellenemedi', 'error');
        btn.disabled = false; btn.textContent = 'Güncelle';
      }
    });
  },

  // ── Admin: Delete Modal (overlay DOM) ──
  openDeleteModal(id: string) {
    const row = this.rows.find((r: LeaveRow) => r.id === id);
    if (!row) return;

    const overlay = document.createElement('div');
    overlay.className = 'lv-overlay';
    overlay.innerHTML = `
      <div class="lv-modal lv-modal--sm" style="text-align:center">
        <div style="display:flex;justify-content:center;color:#ef4444;margin-bottom:16px">${I_TRASH2}</div>
        <h3 style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Talebi Sil</h3>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">
          Bu izin talebini silmek istediğinize emin misiniz?
        </p>
        <div class="lv-field" style="text-align:left;margin-bottom:20px">
          <label class="lv-label">Silme Nedeni</label>
          <textarea class="lv-input lv-textarea" id="dm-reason" placeholder="İptal edilme sebebi..."></textarea>
        </div>
        <div style="display:flex;gap:12px">
          <button class="lv-modal-cancel-btn" id="dm-cancel">Vazgeç</button>
          <button class="lv-modal-del-confirm-btn" id="dm-confirm" disabled>Sil</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e: Event) => { if (e.target === overlay) close(); });
    overlay.querySelector('#dm-cancel')?.addEventListener('click', close);

    const reasonEl  = overlay.querySelector('#dm-reason') as HTMLTextAreaElement;
    const confirmEl = overlay.querySelector<HTMLButtonElement>('#dm-confirm')!;
    reasonEl.addEventListener('input', () => {
      confirmEl.disabled = !reasonEl.value.trim();
    });

    confirmEl.addEventListener('click', async () => {
      confirmEl.disabled = true; confirmEl.textContent = 'Siliniyor...';
      try {
        await api.patch(`/api/v1/leaves/${row.id}/cancel`);
        Toast.show('Talep silindi', 'success');
        close();
        await this.loadLeaves();
      } catch (err: unknown) {
        Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error');
        confirmEl.disabled = false; confirmEl.textContent = 'Sil';
      }
    });
  },

  // ── Excel indirme ──
  async downloadExcel() {
    this.excelLoading = true;
    try {
      const res = await fetch('/api/v1/reports/excel/leaves', { credentials: 'include' });
      if (!res.ok) throw new Error('Rapor alınamadı');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `izin-raporu-${new Date().toISOString().slice(0, 7)}.xlsx`,
      });
      a.click();
      URL.revokeObjectURL(url);
      Toast.show('Excel raporu indirildi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'İndirilemedi', 'error');
    } finally {
      this.excelLoading = false;
    }
  },
}));

// ── Sayfa sınıfı ─────────────────────────────────────────────
export class LeavesPage extends BasePage {
  async render(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="lv-page" x-data="leavesPage()" x-init="init()">

        <!-- Başlık -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:12px;flex-wrap:wrap">
          <h2 class="lv-page-title">
            <span style="color:var(--accent)">${I_FILE}</span>
            İzin ve Fazla Mesai Yönetimi
          </h2>
          <button
            x-show="isAdminOrMudur"
            x-cloak
            class="mv-excel-btn"
            style="flex-shrink:0"
            :disabled="excelLoading"
            @click="downloadExcel()"
          >
            ${I_DOWN}
            <span x-text="excelLoading ? 'İndiriliyor...' : 'İzin Raporu İndir'"></span>
          </button>
        </div>

        <!-- 4 İstatistik Kartı -->
        <div class="lv-stats-grid">
          <div class="lv-stat-card">
            <p class="lv-stat-label">Yıllık İzin</p>
            <p class="lv-stat-val" style="color:var(--accent)" x-text="leaveBal"></p>
            <p class="lv-stat-sub">Kalan Gün</p>
          </div>
          <div class="lv-stat-card">
            <p class="lv-stat-label">Bekleyen</p>
            <p class="lv-stat-val" style="color:var(--text-primary)" x-text="pendingCount"></p>
            <p class="lv-stat-sub">Onay Bekleyen</p>
          </div>
          <div class="lv-stat-card">
            <p class="lv-stat-label">Fazla Mesai</p>
            <p class="lv-stat-val" style="color:#60a5fa">0.0</p>
            <p class="lv-stat-sub">Onaylı Saat</p>
          </div>
          <div class="lv-stat-card">
            <p class="lv-stat-label" x-text="isPriv ? 'Yetkili' : 'Yönetici'"></p>
            <p style="font-size:13px;font-weight:700;color:var(--text-primary)"
               x-text="isPriv ? 'Onay Verebilir' : 'Sistem Yöneticisi'"></p>
            <p class="lv-stat-sub">Onay Makamı</p>
          </div>
        </div>

        <!-- 2 Kolon: Sol Form / Sağ Liste -->
        <div class="lv-two-col">

          <!-- SOL: Formlar -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <!-- İzin Talebi Formu -->
            <section class="lv-form-card">
              <h3 class="lv-form-title">
                <span style="color:#22c55e">${I_PLUS}</span> İzin Talebi Oluştur
              </h3>
              <form @submit.prevent="submitLeave()" style="display:flex;flex-direction:column;gap:16px">
                <div class="lv-field">
                  <label class="lv-label">Talep Türü</label>
                  <select class="lv-input" x-model="form.type">
                    <option value="annual">Yıllık İzin</option>
                    <option value="report">Rapor</option>
                    <option value="excuse">Mazeret İzni</option>
                  </select>
                </div>
                <div class="lv-grid-2">
                  <div class="lv-field">
                    <label class="lv-label">Başlangıç</label>
                    <input class="lv-input" type="date" required
                      x-model="form.startDate"
                      @change="calcDays()" />
                  </div>
                  <div class="lv-field">
                    <label class="lv-label">Bitiş</label>
                    <input class="lv-input" type="date" required
                      x-model="form.endDate"
                      @change="calcDays()" />
                  </div>
                </div>
                <div class="lv-field">
                  <label class="lv-label">Gün Sayısı</label>
                  <input class="lv-input" type="number" disabled :value="form.days" />
                </div>
                <div class="lv-field">
                  <label class="lv-label">Açıklama</label>
                  <textarea class="lv-input lv-textarea" required
                    placeholder="İzin nedeni..."
                    x-model="form.reason"></textarea>
                </div>
                <button type="submit" class="lv-submit-btn" :disabled="leaveSubmitting">
                  <span x-text="leaveSubmitting ? 'Gönderiliyor...' : 'Talep Gönder'"></span>
                </button>
              </form>
            </section>

            <!-- Fazla Mesai Talebi Formu -->
            <section class="lv-form-card">
              <h3 class="lv-form-title">
                <span style="color:#3b82f6">${I_PLUS}</span> Fazla Mesai Talebi
              </h3>
              <form @submit.prevent="submitOt()" style="display:flex;flex-direction:column;gap:16px">
                <div class="lv-grid-3">
                  <div class="lv-field">
                    <label class="lv-label">Tarih</label>
                    <input class="lv-input" type="date" required x-model="otForm.date" />
                  </div>
                  <div class="lv-field">
                    <label class="lv-label">Mesai Başlangıç</label>
                    <input class="lv-input" type="time" required
                      x-model="otForm.startTime"
                      @change="calcOtHours()" />
                  </div>
                  <div class="lv-field">
                    <label class="lv-label">Mesai Bitiş</label>
                    <input class="lv-input" type="time" required
                      x-model="otForm.endTime"
                      @change="calcOtHours()" />
                  </div>
                </div>
                <div class="lv-field">
                  <label class="lv-label">Toplam Saat</label>
                  <input class="lv-input" type="number" step="0.1" min="0.1"
                    placeholder="Kaç saat?" required
                    x-model="otForm.hours" />
                </div>
                <div class="lv-field">
                  <label class="lv-label">Açıklama</label>
                  <textarea class="lv-input lv-textarea" required
                    placeholder="Çalışma detayı..."
                    x-model="otForm.description"></textarea>
                </div>
                <button type="submit" class="lv-ot-submit-btn" :disabled="otSubmitting">
                  <span x-text="otSubmitting ? 'Gönderiliyor...' : 'Talep Gönder'"></span>
                </button>
              </form>
            </section>
          </div>

          <!-- SAĞ: Listeler -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <!-- İzin Taleplerim -->
            <section style="display:flex;flex-direction:column;gap:16px">
              <h3 style="font-size:18px;font-weight:700;color:var(--text-primary)">İzin Taleplerim</h3>
              <div style="display:flex;flex-direction:column;gap:12px">

                <!-- Yükleniyor skeleton -->
                <template x-if="loadingRows">
                  <div>
                    <div class="lv-item-card" style="margin-bottom:12px">
                      <div style="display:flex;gap:8px;margin-bottom:10px">
                        <div class="skeleton" style="width:120px;height:14px;border-radius:6px"></div>
                      </div>
                      <div class="skeleton" style="width:200px;height:10px;border-radius:5px;margin-bottom:8px"></div>
                      <div class="skeleton" style="width:160px;height:12px;border-radius:5px"></div>
                    </div>
                    <div class="lv-item-card" style="margin-bottom:12px">
                      <div style="display:flex;gap:8px;margin-bottom:10px">
                        <div class="skeleton" style="width:120px;height:14px;border-radius:6px"></div>
                      </div>
                      <div class="skeleton" style="width:200px;height:10px;border-radius:5px;margin-bottom:8px"></div>
                      <div class="skeleton" style="width:160px;height:12px;border-radius:5px"></div>
                    </div>
                  </div>
                </template>

                <!-- Boş durum -->
                <template x-if="!loadingRows && rows.length === 0">
                  <div class="lv-empty-dashed">Henüz izin talebi yok.</div>
                </template>

                <!-- İzin Satırları -->
                <template x-if="!loadingRows && rows.length > 0">
                  <div>
                    <template x-for="row in rows" :key="row.id">
                      <div class="lv-item-card" style="margin-bottom:12px">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                          <div>
                            <p style="font-weight:700;font-size:14px;color:var(--text-primary)" x-text="row.user_name"></p>
                            <p style="font-size:10px;color:var(--text-muted);margin-top:2px">
                              <span x-text="fmtDateRange(row.start_date, row.end_date)"></span>
                              &nbsp;·&nbsp;
                              <span x-text="row.days + ' Gün'"></span>
                              &nbsp;·&nbsp;
                              <span x-text="typeLabel(row.type)"></span>
                            </p>
                          </div>
                          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                            <template x-if="isAdmin">
                              <div class="lv-hover-btns">
                                <button class="lv-icon-btn lv-icon-btn--edit"
                                  @click="openEditModal(row.id)">${I_EDIT}</button>
                                <button class="lv-icon-btn lv-icon-btn--del"
                                  @click="openDeleteModal(row.id)">${I_TRASH}</button>
                              </div>
                            </template>
                            <span class="lv-status-badge"
                              :class="badgeClass(row.status)"
                              x-text="badgeText(row.status)"></span>
                          </div>
                        </div>

                        <!-- Açıklama -->
                        <template x-if="row.reason">
                          <p style="font-size:12px;color:#a1a1aa;font-style:italic;margin-top:8px">
                            "<span x-text="row.reason"></span>"
                          </p>
                        </template>

                        <!-- Onayla/Reddet — yönetici + bekleyen + başkasının talebi -->
                        <template x-if="isPriv && row.status === 'pending' && row.user_id !== userId">
                          <div style="display:flex;gap:8px;padding-top:10px">
                            <button class="lv-approve-btn" @click="approveLeave(row.id)">
                              ${I_CHECK} Onayla
                            </button>
                            <button class="lv-reject-btn" @click="rejectLeave(row.id)">
                              ${I_X_SM} Reddet
                            </button>
                          </div>
                        </template>

                        <!-- İptal — kendi bekleyen talebi -->
                        <template x-if="row.user_id === userId && row.status === 'pending'">
                          <div style="padding-top:8px">
                            <button class="lv-cancel-btn" @click="cancelLeave(row.id)">Talebi İptal Et</button>
                          </div>
                        </template>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </section>

            <!-- Fazla Mesai Taleplerim -->
            <section style="display:flex;flex-direction:column;gap:16px">
              <h3 style="font-size:18px;font-weight:700;color:var(--text-primary)">Fazla Mesai Taleplerim</h3>
              <div style="display:flex;flex-direction:column;gap:12px">

                <!-- Yükleniyor skeleton -->
                <template x-if="loadingOT">
                  <div>
                    <div class="lv-item-card" style="margin-bottom:12px">
                      <div style="display:flex;gap:8px;margin-bottom:10px">
                        <div class="skeleton" style="width:120px;height:14px;border-radius:6px"></div>
                      </div>
                      <div class="skeleton" style="width:200px;height:10px;border-radius:5px;margin-bottom:8px"></div>
                      <div class="skeleton" style="width:160px;height:12px;border-radius:5px"></div>
                    </div>
                    <div class="lv-item-card" style="margin-bottom:12px">
                      <div style="display:flex;gap:8px;margin-bottom:10px">
                        <div class="skeleton" style="width:120px;height:14px;border-radius:6px"></div>
                      </div>
                      <div class="skeleton" style="width:200px;height:10px;border-radius:5px;margin-bottom:8px"></div>
                      <div class="skeleton" style="width:160px;height:12px;border-radius:5px"></div>
                    </div>
                  </div>
                </template>

                <!-- Boş durum -->
                <template x-if="!loadingOT && overtimes.length === 0">
                  <div class="lv-empty-dashed">Henüz fazla mesai talebi yok.</div>
                </template>

                <!-- Mesai Satırları -->
                <template x-if="!loadingOT && overtimes.length > 0">
                  <div>
                    <template x-for="ot in overtimes" :key="ot.id">
                      <div class="lv-item-card" style="margin-bottom:12px">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                          <div>
                            <p style="font-weight:700;font-size:14px;color:var(--text-primary)" x-text="ot.user_name"></p>
                            <p style="font-size:10px;color:var(--text-muted);margin-top:2px">
                              <span x-text="fmtDate(ot.date)"></span>
                              &nbsp;·&nbsp;
                              <span x-text="ot.hours + ' Saat'"></span>
                            </p>
                          </div>
                          <span class="lv-status-badge"
                            :class="badgeClass(ot.status)"
                            x-text="badgeText(ot.status)"></span>
                        </div>
                        <template x-if="ot.description">
                          <p style="font-size:12px;color:#a1a1aa;font-style:italic">
                            "<span x-text="ot.description"></span>"
                          </p>
                        </template>
                        <template x-if="ot.user_id === userId && ot.status === 'pending'">
                          <div style="padding-top:8px">
                            <button class="lv-cancel-btn" @click="cancelOt(ot.id)">Talebi İptal Et</button>
                          </div>
                        </template>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </section>

          </div><!-- / SAĞ kolon -->
        </div><!-- / lv-two-col -->
      </div><!-- / lv-page -->
    `;
  }
}
