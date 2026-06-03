import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import QRCode from 'qrcode';

interface QRResponse { success: boolean; value: string; expiresIn: number; }

let _timer: ReturnType<typeof setInterval> | null = null;
let _countdown: ReturnType<typeof setInterval> | null = null;

Alpine.data('qrDisplayPage', () => ({
  loading:   true,
  error:     false,
  timerPct:  100,
  timerSec:  30,

  async init() {
    await this.loadAndDraw();
    _timer = setInterval(() => this.loadAndDraw(), 28_000);
  },

  async loadAndDraw() {
    this.loading = true;
    this.error   = false;
    if (_countdown) { clearInterval(_countdown); _countdown = null; }

    try {
      const data   = await api.get<QRResponse>('/api/v1/attendance/qr');
      const canvas = this.$refs['qrCanvas'] as HTMLCanvasElement | undefined;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, data.value, {
        width: 280, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      this._startCountdown(data.expiresIn);
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
    }
  },

  _startCountdown(initial: number) {
    let remaining = initial;
    const tick = () => {
      if (remaining <= 0) remaining = 30;
      this.timerSec = remaining;
      this.timerPct = (remaining / 30) * 100;
      remaining--;
    };
    tick();
    _countdown = setInterval(tick, 1000);
  },
}));

export class QRDisplayPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="qr-display-page" x-data="qrDisplayPage()">
        <div class="qr-display-card">
          <h1 class="qr-display-title">PDKS — Giriş/Çıkış QR</h1>
          <p class="qr-display-sub">Bu ekranı ofis girişinde açık bırakın</p>

          <div class="qr-canvas-wrap">
            <canvas x-ref="qrCanvas" style="display:block"></canvas>
            <div class="qr-refresh-overlay" x-show="loading">
              <div class="qr-refresh-spinner"></div>
            </div>
            <div class="qr-refresh-overlay" x-show="error" style="flex-direction:column;gap:8px">
              <span style="color:#ef4444;font-weight:700">Yüklenemedi</span>
              <button class="btn btn-ghost" style="font-size:12px" @click="loadAndDraw()">Tekrar Dene</button>
            </div>
          </div>

          <div class="qr-timer-row">
            <div class="qr-timer-bar-wrap">
              <div class="qr-timer-bar" :style="\`width:\${timerPct}%\`"></div>
            </div>
            <span class="qr-timer-text" x-text="timerSec + 's'"></span>
          </div>

          <p class="qr-display-hint">Kod her 30 saniyede otomatik yenilenir</p>
        </div>
      </div>`;
  }

  destroy() {
    if (_timer)    { clearInterval(_timer);    _timer = null; }
    if (_countdown){ clearInterval(_countdown); _countdown = null; }
    super.destroy();
  }
}
