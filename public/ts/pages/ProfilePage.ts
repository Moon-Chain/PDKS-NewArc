import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';

interface Profile {
  id: string; personnel_id: string; name: string; title?: string;
  email?: string; role: string; leave_balance: number;
  start_date?: string; avatar_path?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Yönetici', mudur: 'Müdür', takim_lideri: 'Takım Lideri', personel: 'Personel',
};

Alpine.data('profilePage', () => ({
  profile:    null as Profile | null,
  loading:    true,
  uploading:  false,
  pushPerm:   'default' as NotificationPermission | 'unsupported',
  showPwModal: false,
  pw:          { current: '', next: '', loading: false },

  get roleLabel(): string { return ROLE_LABELS[this.profile?.role ?? ''] ?? (this.profile?.role ?? ''); },
  get startStr(): string {
    if (!this.profile?.start_date) return '—';
    return new Date(this.profile.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  },
  get pushSupported(): boolean { return 'serviceWorker' in navigator && 'PushManager' in window; },

  async init() {
    await this.load();
    if (typeof Notification !== 'undefined') this.pushPerm = Notification.permission;
    else this.pushPerm = 'unsupported';
  },

  async load() {
    this.loading = true;
    try {
      const res = await api.get<Profile>('/api/v1/auth/me');
      this.profile = res;
      state.set('profile', res);
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Profil yüklenemedi', 'error');
    } finally {
      this.loading = false;
    }
  },

  async uploadAvatar(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.profile || this.uploading) return;
    if (file.size > 8 * 1024 * 1024) { Toast.show('Fotoğraf en fazla 8 MB olabilir', 'error'); return; }
    this.uploading = true;
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch(`/api/v1/users/${this.profile.id}/avatar`, { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) { const j = await res.json() as { error?: string }; throw new Error(j.error ?? 'Yükleme başarısız'); }
      const data = await res.json() as { avatarPath: string };
      this.profile = { ...this.profile, avatar_path: data.avatarPath };
      state.set('profile', this.profile);
      Toast.show('Profil fotoğrafı güncellendi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yükleme başarısız', 'error');
    } finally {
      this.uploading = false;
    }
  },

  async deleteAvatar() {
    if (!this.profile) return;
    const ok = await Modal.confirm({ title: 'Fotoğrafı Sil', content: 'Profil fotoğrafınız silinecek. Devam edilsin mi?', confirmText: 'Evet, Sil', cancelText: 'Vazgeç', danger: true });
    if (!ok) return;
    try {
      await api.patch(`/api/v1/users/${this.profile.id}`, { avatar_path: null });
      this.profile = { ...this.profile, avatar_path: undefined };
      state.set('profile', this.profile);
      Toast.show('Profil fotoğrafı silindi', 'success');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error'); }
  },

  async enablePush() {
    if (!this.pushSupported) { Toast.show('Tarayıcınız push bildirimleri desteklemiyor', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      this.pushPerm = perm;
      Toast.show('Push bildirimi izni reddedildi', 'warning');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const { key } = await api.get<{ key: string }>('/api/v1/push/vapid-key');
      if (!key) { Toast.show('Sunucu yapılandırma hatası', 'error'); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _b64ToUint8(key) });
      await api.post('/api/v1/push/subscribe', { subscription: sub.toJSON() });
      // Sadece başarılı kayıt sonrası UI güncellenir
      this.pushPerm = 'granted';
      Toast.show('Push bildirimleri etkinleştirildi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Push etkinleştirilemedi', 'error');
    }
  },

  async disablePush() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
      await api.delete('/api/v1/push/subscribe').catch(() => {});
      this.pushPerm = 'default';
      Toast.show('Push bildirimleri kapatıldı', 'success');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Push kapatılamadı', 'error'); }
  },

  async submitPassword() {
    if (!this.pw.current || !this.pw.next) { Toast.show('Tüm alanları doldurun', 'error'); return; }
    this.pw.loading = true;
    try {
      await api.put('/api/v1/auth/password', { currentPassword: this.pw.current, newPassword: this.pw.next });
      Toast.show('Şifre güncellendi — tekrar giriş yapın', 'success');
      this.showPwModal = false;
      this.pw = { current: '', next: '', loading: false };
      setTimeout(async () => {
        await api.post('/api/v1/auth/logout', {});
        state.set('user', null); state.set('profile', null);
        (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/login');
      }, 1200);
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Güncellenemedi', 'error');
    } finally { this.pw.loading = false; }
  },

  async logout() {
    try { await api.post('/api/v1/auth/logout', {}); } finally {
      state.set('user', null); state.set('profile', null);
      (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/login');
    }
  },
}));

function _b64ToUint8(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...atob(b64)].map(c => c.charCodeAt(0)));
}

const I_USER    = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const I_USER_LG = `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const I_CAM     = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const I_CAM_SM  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const I_TRASH   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const I_KEY     = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`;
const I_LOGOUT  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const I_BELL    = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const I_BELL_OFF= `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const I_X       = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export class ProfilePage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="profile-page" x-data="profilePage()">

        <div class="profile-page-header">
          <h2 class="profile-page-title">${I_USER} Profil Bilgileri</h2>
        </div>

        <!-- Skeleton -->
        <template x-if="loading">
          <div class="profile-main-card profile-skeleton-wrap">
            <div class="skeleton" style="width:112px;height:112px;border-radius:50%;margin:0 auto"></div>
            <div class="skeleton" style="height:20px;width:45%;margin:14px auto 0"></div>
            <div class="skeleton" style="height:14px;width:25%;margin:8px auto 0"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px">
              <div class="skeleton" style="height:72px;border-radius:16px"></div>
              <div class="skeleton" style="height:72px;border-radius:16px"></div>
              <div class="skeleton" style="height:80px;border-radius:16px;grid-column:1/-1"></div>
            </div>
            <div class="skeleton" style="height:56px;border-radius:12px;margin-top:24px"></div>
            <div class="skeleton" style="height:56px;border-radius:12px;margin-top:10px"></div>
          </div>
        </template>

        <!-- İçerik -->
        <template x-if="!loading && profile">
          <div class="profile-main-card">

            <!-- Avatar -->
            <div class="profile-avatar-section">
              <div class="profile-avatar-group">
                <template x-if="profile.avatar_path">
                  <img class="profile-big-avatar" :src="profile.avatar_path" :alt="profile.name" />
                </template>
                <template x-if="!profile.avatar_path">
                  <div class="profile-big-avatar profile-big-avatar--initial">${I_USER_LG}</div>
                </template>
                <label class="avatar-overlay" :class="uploading ? 'loading' : ''" title="Fotoğraf yükle">
                  ${I_CAM}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadAvatar($event)" />
                </label>
              </div>

              <div class="profile-identity">
                <h3 class="profile-display-name" x-text="profile.name"></h3>
                <p class="profile-display-title" x-show="profile.title" x-text="profile.title"></p>
                <p class="profile-display-role" x-text="roleLabel"></p>
              </div>

              <div class="profile-avatar-actions">
                <label class="avatar-action-btn avatar-action-btn--orange" style="cursor:pointer">
                  ${I_CAM_SM}
                  <span x-text="profile.avatar_path ? 'Değiştir' : 'Fotoğraf Ekle'"></span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadAvatar($event)" />
                </label>
                <button x-show="profile.avatar_path" class="avatar-action-btn avatar-action-btn--red" @click="deleteAvatar()">
                  ${I_TRASH} Sil
                </button>
              </div>
            </div>

            <!-- Bilgi kartları -->
            <div class="profile-info-grid">
              <div class="profile-info-tile">
                <p class="tile-label">Personel ID</p>
                <p class="tile-value" x-text="profile.personnel_id"></p>
              </div>
              <div class="profile-info-tile">
                <p class="tile-label">İşe Giriş Tarihi</p>
                <p class="tile-value" x-text="startStr"></p>
              </div>
              <div class="profile-info-tile profile-info-tile--full">
                <p class="tile-label">Resmi Yıllık İzin Bakiyesi</p>
                <div class="tile-leave-row">
                  <p class="tile-leave-days" x-text="profile.leave_balance + ' GÜN'"></p>
                  <div class="tile-leave-ref">
                    <p class="tile-leave-ref-label">Toplam Hak Ediş</p>
                    <p class="tile-leave-ref-val" x-text="profile.leave_balance + ' Gün'"></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Push Bildirimleri -->
            <template x-if="pushSupported">
              <div class="profile-push-section">
                <template x-if="pushPerm === 'granted'">
                  <div class="profile-push-card profile-push-card--active">
                    <div class="profile-push-header">
                      <span class="profile-push-icon profile-push-icon--on">${I_BELL}</span>
                      <div>
                        <p class="profile-push-title">Push Bildirimleri Aktif</p>
                        <p class="profile-push-desc">Uygulama kapalıyken bildirim alıyorsunuz.</p>
                      </div>
                    </div>
                    <button class="profile-action-btn profile-action-btn--red" @click="disablePush()" style="margin-top:12px">
                      ${I_BELL_OFF} Bildirimleri Kapat
                    </button>
                  </div>
                </template>
                <template x-if="pushPerm === 'denied'">
                  <div class="profile-push-card profile-push-card--denied">
                    <div class="profile-push-header">
                      <span class="profile-push-icon profile-push-icon--off">${I_BELL_OFF}</span>
                      <div>
                        <p class="profile-push-title">Push Bildirimleri Engellendi</p>
                        <p class="profile-push-desc">Tarayıcı ayarlarından izni etkinleştirin.</p>
                      </div>
                    </div>
                  </div>
                </template>
                <template x-if="pushPerm === 'default'">
                  <div class="profile-push-card">
                    <div class="profile-push-header">
                      <span class="profile-push-icon">${I_BELL}</span>
                      <div>
                        <p class="profile-push-title">Push Bildirimleri</p>
                        <p class="profile-push-desc">Uygulama kapalıyken bildirim alın.</p>
                      </div>
                    </div>
                    <button class="profile-action-btn profile-action-btn--orange" @click="enablePush()" style="margin-top:12px">
                      ${I_BELL} Bildirimleri Etkinleştir
                    </button>
                  </div>
                </template>
              </div>
            </template>

            <!-- Eylemler -->
            <div class="profile-actions">
              <button class="profile-action-btn profile-action-btn--orange" @click="showPwModal = true">
                ${I_KEY} Şifreyi Değiştir
              </button>
              <button class="profile-action-btn profile-action-btn--red" @click="logout()">
                ${I_LOGOUT} Oturumu Kapat
              </button>
            </div>
          </div>
        </template>

        <!-- Şifre Modalı -->
        <div class="pw-overlay" x-show="showPwModal" @click.self="showPwModal = false" style="display:none">
          <div class="pw-modal">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
              <h3 style="font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px">
                <span style="color:var(--color-primary)">${I_KEY}</span> Şifreyi Değiştir
              </h3>
              <button class="pw-close" @click="showPwModal = false">${I_X}</button>
            </div>
            <form @submit.prevent="submitPassword()" style="display:flex;flex-direction:column;gap:16px">
              <div style="display:flex;flex-direction:column;gap:6px">
                <label class="pw-label">Mevcut Şifre</label>
                <input class="pw-input" type="password" x-model="pw.current" required placeholder="Mevcut şifreniz" />
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <label class="pw-label">Yeni Şifre</label>
                <input class="pw-input" type="password" x-model="pw.next" required minlength="4" placeholder="En az 4 karakter" />
              </div>
              <button type="submit" class="pw-submit" :disabled="pw.loading" style="margin-top:8px">
                <span x-text="pw.loading ? 'Güncelleniyor...' : 'Güncelle'"></span>
              </button>
            </form>
          </div>
        </div>

      </div>`;
  }
}
