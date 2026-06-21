import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { toast } from '../adminUi.js';
import { renderAppearanceTab, attachAppearanceTab } from '../tweaks/AppearanceTweaks.js';

interface Settings {
  company_id: string;
  office_ip: string | null;
  qr_secret: string;
  company_name: string | null;
  work_days_per_week: number;
  rounding_threshold_minutes: number;
  shift_start: string;
  shift_end: string;
}

type Tab = 'genel' | 'gorunum';

export class SettingsPage extends BasePage {
  private tab: Tab = 'genel';
  private settings: Settings | null = null;

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    try {
      const res = await api.get<{ success: boolean; settings: Settings }>('/api/v1/settings');
      this.settings = res.settings;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Ayarlar yüklenemedi', 'error');
    }
    this.draw();
  }

  private draw(): void {
    this.container.innerHTML = `
      <div class="settings-tabs">
        <button class="settings-tab ${this.tab === 'genel' ? 'active' : ''}" data-tab="genel">Genel</button>
        <button class="settings-tab ${this.tab === 'gorunum' ? 'active' : ''}" data-tab="gorunum">Görünüm</button>
      </div>
      <div id="settings-tab-content">
        ${this.tab === 'genel' ? this.renderGeneralTab() : renderAppearanceTab()}
      </div>
    `;

    this.on('.settings-tabs', 'click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
      if (!btn) return;
      this.tab = btn.dataset.tab as Tab;
      this.draw();
    });

    if (this.tab === 'genel') {
      this.attachGeneralTab();
    } else {
      const content = this.$('#settings-tab-content') as HTMLElement;
      attachAppearanceTab(content, () => this.draw());
    }
  }

  private renderGeneralTab(): string {
    const s = this.settings;
    return `
      <div class="card">
        <div class="card-title">Şirket Genel Bilgileri</div>
        <form id="settings-form" class="form-grid">
          <div class="form-field">
            <label class="label">Şirket Adı</label>
            <input class="input" name="company_name" value="${s?.company_name ?? ''}" placeholder="Örn: ABC Yazılım Ltd. Şti." />
          </div>
          <div class="form-field">
            <label class="label">Haftalık Çalışma Günü</label>
            <select class="input" name="work_days_per_week">
              <option value="5" ${s?.work_days_per_week === 5 ? 'selected' : ''}>5 Gün</option>
              <option value="6" ${s?.work_days_per_week === 6 ? 'selected' : ''}>6 Gün</option>
              <option value="7" ${s?.work_days_per_week === 7 ? 'selected' : ''}>7 Gün</option>
            </select>
          </div>
          <div class="form-field">
            <label class="label">Hesaplama Toleransı (Dk)</label>
            <input class="input" type="number" name="rounding_threshold_minutes" value="${s?.rounding_threshold_minutes ?? 30}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Başlangıcı</label>
            <input class="input" type="time" name="shift_start" value="${s?.shift_start?.slice(0, 5) ?? '09:00'}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Bitişi</label>
            <input class="input" type="time" name="shift_end" value="${s?.shift_end?.slice(0, 5) ?? '18:00'}" />
          </div>
          <div class="form-field">
            <label class="label">İş Yeri IP Adresi</label>
            <input class="input" name="office_ip" value="${s?.office_ip ?? ''}" placeholder="Örn: 176.234.12.34" />
          </div>
          <div class="form-field">
            <label class="label">QR Gizli Anahtar</label>
            <div style="display:flex; gap:var(--space-2)">
              <input class="input" name="qr_secret" value="${s?.qr_secret ?? ''}" placeholder="QR gizli anahtarı" />
              <button type="button" class="btn btn-ghost btn-sm" id="settings-regen-secret">Yenile</button>
            </div>
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <button type="submit" class="btn btn-primary">Ayarları Kaydet</button>
          </div>
        </form>
      </div>
    `;
  }

  private attachGeneralTab(): void {
    const form = this.$('#settings-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, unknown> = {};
      fd.forEach((v, k) => { data[k] = v || null; });
      if (data.work_days_per_week)         data.work_days_per_week         = Number(data.work_days_per_week);
      if (data.rounding_threshold_minutes) data.rounding_threshold_minutes = Number(data.rounding_threshold_minutes);
      try {
        const res = await api.patch<{ success: boolean; settings: Settings }>('/api/v1/settings', data);
        this.settings = res.settings;
        toast('Ayarlar kaydedildi', 'success');
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Kaydedilemedi', 'error');
      }
    });

    this.on('#settings-regen-secret', 'click', async () => {
      try {
        const res = await api.post<{ success: boolean; secret: string }>('/api/v1/settings/generate-secret', {});
        const input = this.$('input[name="qr_secret"]') as HTMLInputElement | null;
        if (input) input.value = res.secret;
        toast('Yeni QR sırrı üretildi — Ayarları kaydetmeyi unutmayın!', 'warning');
      } catch {
        toast('Sır üretilemedi', 'error');
      }
    });
  }
}
