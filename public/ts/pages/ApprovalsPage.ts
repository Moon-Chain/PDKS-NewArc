import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';
import { errMsg } from '../core/errMsg.js';
import { alpineAvatar } from '../core/Avatar.js';

interface LeaveRow {
  id: string; user_name: string; avatar_path?: string | null;
  start_date: string; end_date: string;
  days: number; reason: string; type: string; status: string;
}
interface OTRow {
  id: string; user_name: string; avatar_path?: string | null;
  date: string; hours: number; description: string | null;
}
interface ManualRow { id: string; user_name: string; type: 'in' | 'out'; timestamp: string; ip_address: string | null; }

const TYPE_LABELS: Record<string, string> = { annual: 'Yıllık İzin', report: 'Rapor', excuse: 'Mazeret' };

Alpine.data('approvalsPage', () => ({
  role:           '' as string,
  leaves:         [] as LeaveRow[],
  overtimes:      [] as OTRow[],
  manuals:        [] as ManualRow[],
  loadingLeaves:  true,
  loadingOT:      true,
  loadingManuals: true,

  get canApprove(): boolean { return ['admin', 'mudur', 'takim_lideri'].includes(this.role); },
  get isAdmin(): boolean { return this.role === 'admin'; },

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  fmtDateTime(d: string): string {
    const dt = new Date(d);
    return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' ' + dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  },
  typeLabel(t: string): string { return TYPE_LABELS[t] ?? t; },

  async init() {
    const user = state.get('user') as { role: string } | null;
    this.role = user?.role ?? 'personel';
    if (!this.canApprove) return;
    await Promise.all([this.loadLeaves(), this.loadOvertimes(), this.loadManuals()]);
  },

  async loadLeaves() {
    this.loadingLeaves = true;
    try {
      const res = await api.get<{ rows: LeaveRow[] }>('/api/v1/leaves?status=pending&limit=100');
      this.leaves = (res.rows ?? []).filter(r => r.status === 'pending');
    } catch { Toast.show('İzinler yüklenemedi', 'error'); }
    finally { this.loadingLeaves = false; }
  },

  async loadOvertimes() {
    this.loadingOT = true;
    try {
      const res = await api.get<{ rows: OTRow[] }>('/api/v1/overtime?status=pending&limit=100');
      this.overtimes = res.rows ?? [];
    } catch {}
    finally { this.loadingOT = false; }
  },

  async loadManuals() {
    this.loadingManuals = true;
    try {
      const res = await api.get<{ rows: ManualRow[] }>('/api/v1/attendance/pending-manual');
      this.manuals = res.rows ?? [];
    } catch {}
    finally { this.loadingManuals = false; }
  },

  async approveLeave(id: string) {
    try {
      await api.patch(`/api/v1/leaves/${id}/approve`);
      this.leaves = this.leaves.filter(r => r.id !== id);
      Toast.show('Talep onaylandı', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'İzin onaylanamadı'), 'error'); }
  },

  async rejectLeave(id: string) {
    try {
      await api.patch(`/api/v1/leaves/${id}/reject`);
      this.leaves = this.leaves.filter(r => r.id !== id);
      Toast.show('Talep reddedildi', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'İzin reddedilemedi'), 'error'); }
  },

  async approveOT(id: string) {
    try {
      await api.patch(`/api/v1/overtime/${id}/approve`);
      this.overtimes = this.overtimes.filter(r => r.id !== id);
      Toast.show('Mesai onaylandı', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'Mesai onaylanamadı'), 'error'); }
  },

  async rejectOT(id: string) {
    try {
      await api.patch(`/api/v1/overtime/${id}/reject`);
      this.overtimes = this.overtimes.filter(r => r.id !== id);
      Toast.show('Mesai reddedildi', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'Mesai reddedilemedi'), 'error'); }
  },

  async approveManual(id: string) {
    try {
      await api.patch(`/api/v1/attendance/${id}/approve-manual`);
      this.manuals = this.manuals.filter(r => r.id !== id);
      Toast.show('Kayıt onaylandı', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'Kayıt onaylanamadı'), 'error'); }
  },

  async rejectManual(id: string) {
    try {
      await api.delete(`/api/v1/attendance/${id}`);
      this.manuals = this.manuals.filter(r => r.id !== id);
      Toast.show('Kayıt reddedildi', 'success');
    } catch (err: unknown) { Toast.show(errMsg(err, 'Kayıt reddedilemedi'), 'error'); }
  },
}));

const I_CHECK2 = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const I_FILE   = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const I_CLOCK  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const I_TRUCK  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const I_CHECK  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const I_X      = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export class ApprovalsPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="ap-page" x-data="approvalsPage()">

        <!-- Yetkisiz -->
        <template x-if="!canApprove">
          <div class="ap-no-perm">
            <div style="color:#4ade80;margin-bottom:16px">${I_CHECK2}</div>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Onaylar</h2>
            <p style="font-size:14px;color:var(--color-muted)">Bu bölüm sadece yöneticilere açıktır.</p>
          </div>
        </template>

        <!-- Yetkili -->
        <template x-if="canApprove">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <h2 class="ap-title">${I_CHECK2} Onay Bekleyen Talepler</h2>
            </div>

            <div class="ap-grid">

              <!-- İzin Onayları -->
              <div class="ap-col">
                <h3 class="ap-col-title">${I_FILE} İzin Onayları</h3>
                <div class="ap-col-list">
                  <template x-if="loadingLeaves">
                    <div><div class="ap-skeleton"></div><div class="ap-skeleton"></div></div>
                  </template>
                  <template x-if="!loadingLeaves && leaves.length === 0">
                    <div class="ap-empty-dashed">Onay bekleyen izin talebi bulunmuyor.</div>
                  </template>
                  <template x-if="!loadingLeaves && leaves.length > 0">
                    <div>
                      <template x-for="r in leaves" :key="r.id">
                        <div class="ap-card">
                          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                            <div style="display:flex;align-items:center;gap:10px">
                              <div class="ap-avatar" :style="r.avatar_path ? 'padding:0;overflow:hidden' : ''">
                                ${alpineAvatar('r.avatar_path', 'r.user_name')}
                              </div>
                              <div>
                                <p style="font-weight:700;font-size:14px" x-text="r.user_name"></p>
                                <p style="font-size:10px;color:var(--color-muted);margin-top:2px"
                                   x-text="fmtDate(r.start_date) + ' - ' + fmtDate(r.end_date) + ' (' + r.days + ' Gün)'"></p>
                                <p style="font-size:10px;color:var(--color-muted)" x-text="typeLabel(r.type)"></p>
                              </div>
                            </div>
                          </div>
                          <p x-show="r.reason" style="font-size:12px;color:#a1a1aa;font-style:italic" x-text="'&quot;' + r.reason + '&quot;'"></p>
                          <div style="display:flex;gap:8px;padding-top:8px">
                            <button class="ap-approve-btn" @click="approveLeave(r.id)">${I_CHECK} Onayla</button>
                            <button class="ap-reject-btn"  @click="rejectLeave(r.id)">${I_X} Reddet</button>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Mesai Onayları -->
              <div class="ap-col">
                <h3 class="ap-col-title">${I_CLOCK} Fazla Mesai Onayları</h3>
                <div class="ap-col-list">
                  <template x-if="loadingOT">
                    <div><div class="ap-skeleton"></div></div>
                  </template>
                  <template x-if="!loadingOT && overtimes.length === 0">
                    <div class="ap-empty-dashed">Onay bekleyen mesai talebi bulunmuyor.</div>
                  </template>
                  <template x-if="!loadingOT && overtimes.length > 0">
                    <div>
                      <template x-for="r in overtimes" :key="r.id">
                        <div class="ap-card">
                          <div style="display:flex;align-items:center;gap:10px">
                            <div class="ap-avatar" :style="r.avatar_path ? 'padding:0;overflow:hidden' : ''">
                              ${alpineAvatar('r.avatar_path', 'r.user_name')}
                            </div>
                            <div>
                              <p style="font-weight:700;font-size:14px" x-text="r.user_name"></p>
                              <p style="font-size:10px;color:var(--color-muted);margin-top:2px"
                                 x-text="fmtDate(r.date) + ' · ' + r.hours + ' Saat'"></p>
                            </div>
                          </div>
                          <p x-show="r.description" style="font-size:12px;color:#a1a1aa;font-style:italic" x-text="'&quot;' + r.description + '&quot;'"></p>
                          <div style="display:flex;gap:8px;padding-top:8px">
                            <button class="ap-approve-btn" @click="approveOT(r.id)">${I_CHECK} Onayla</button>
                            <button class="ap-reject-btn"  @click="rejectOT(r.id)">${I_X} Reddet</button>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Manuel Kayıt Onayları -->
              <div class="ap-col">
                <h3 class="ap-col-title">${I_TRUCK} Manuel Kayıt Onayları</h3>
                <div class="ap-col-list">
                  <template x-if="loadingManuals">
                    <div><div class="ap-skeleton"></div></div>
                  </template>
                  <template x-if="!loadingManuals && manuals.length === 0">
                    <div class="ap-empty-dashed">Onay bekleyen manuel kayıt bulunmuyor.</div>
                  </template>
                  <template x-if="!loadingManuals && manuals.length > 0">
                    <div>
                      <template x-for="r in manuals" :key="r.id">
                        <div class="ap-card">
                          <div>
                            <p style="font-weight:700;font-size:14px" x-text="r.user_name"></p>
                            <p style="font-size:10px;color:var(--color-muted);margin-top:2px"
                               x-text="fmtDateTime(r.timestamp) + ' · ' + (r.type === 'in' ? 'Giriş' : 'Çıkış')"></p>
                          </div>
                          <p x-show="r.ip_address" style="font-size:11px;color:var(--color-muted);font-family:monospace" x-text="r.ip_address"></p>
                          <div style="display:flex;gap:8px;padding-top:8px">
                            <button class="ap-approve-btn" @click="approveManual(r.id)">${I_CHECK} Onayla</button>
                            <button class="ap-reject-btn"  @click="rejectManual(r.id)">${I_X} Reddet</button>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </div>

            </div>
          </div>
        </template>

      </div>`;
  }
}
