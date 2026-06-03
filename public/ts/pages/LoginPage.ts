import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';

interface LoginResponse {
  success: boolean;
  profile: { id: string; role: string; company_id: string; name: string };
}

Alpine.data('loginPage', () => ({
  personnelId: '' as string,
  password:    '' as string,
  loading:     false,
  errors:      { personnelId: '', password: '' } as Record<string, string>,

  validate(): boolean {
    this.errors.personnelId = this.personnelId.trim() ? '' : 'Personel ID zorunludur';
    this.errors.password    = this.password           ? '' : 'Şifre zorunludur';
    return !this.errors.personnelId && !this.errors.password;
  },

  async submit() {
    if (!this.validate()) return;
    this.loading = true;
    try {
      const deviceId = this._getDeviceId();
      const res = await api.post<LoginResponse>('/api/v1/auth/login', {
        personnelId: this.personnelId.trim(),
        password:    this.password,
        deviceId,
      });
      state.set('user',    { id: res.profile.id, role: res.profile.role, company_id: res.profile.company_id });
      state.set('profile', res.profile);
      (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/home');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Giriş başarısız', 'error');
    } finally {
      this.loading = false;
    }
  },

  _getDeviceId(): string {
    let id = localStorage.getItem('pdks_device_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('pdks_device_id', id); }
    return id;
  },
}));

export class LoginPage extends BasePage {
  async render(): Promise<void> {
    this._injectStyles();
    this.container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card card" x-data="loginPage()" x-cloak>
          <div class="login-logo">
            <div class="login-logo-icon">P</div>
            <h1 class="login-title">PDKS</h1>
            <p class="login-subtitle">Personel Devam Kontrol Sistemi</p>
          </div>

          <form @submit.prevent="submit()" novalidate>
            <div class="form-group">
              <label class="label">Personel ID</label>
              <input class="input" :class="errors.personnelId ? 'error' : ''"
                type="text" x-model="personnelId"
                placeholder="Personel ID giriniz"
                autocomplete="username" autocapitalize="none" />
              <span class="field-error" x-text="errors.personnelId"></span>
            </div>

            <div class="form-group">
              <label class="label">Şifre</label>
              <input class="input" :class="errors.password ? 'error' : ''"
                type="password" x-model="password"
                placeholder="Şifrenizi giriniz"
                autocomplete="current-password" />
              <span class="field-error" x-text="errors.password"></span>
            </div>

            <button type="submit" class="btn btn-primary btn-full" :disabled="loading"
              x-text="loading ? 'Giriş yapılıyor...' : 'Giriş Yap'">
              Giriş Yap
            </button>
          </form>
        </div>

      </div>`;
  }

  private _injectStyles() {
    if (document.getElementById('login-page-styles')) return;
    const s = document.createElement('style');
    s.id = 'login-page-styles';
    s.textContent = `
      .login-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:var(--space-4); }
      .login-card { width:100%; max-width:380px; padding:var(--space-8); }
      .login-logo { text-align:center; margin-bottom:var(--space-8); }
      .login-logo-icon { width:56px; height:56px; background:var(--color-primary); border-radius:var(--radius-lg); display:inline-flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:#fff; margin-bottom:var(--space-3); }
      .login-title { font-size:var(--font-size-xl); font-weight:800; letter-spacing:2px; margin-bottom:var(--space-1); }
      .login-subtitle { font-size:var(--font-size-sm); color:var(--color-muted); }
    `;
    document.head.appendChild(s);
  }
}
