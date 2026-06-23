import jsQR from 'jsqr';
import { BaseComponent } from '../core/BaseComponent.js';

export type QRResult = (value: string) => void;
export type QRCancel = () => void;

const ICON_CAM_OFF = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="4"/></svg>`;
const ICON_QR     = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M17 17h4v4"/><path d="M14 21h3"/><path d="M21 14v3"/></svg>`;
const ICON_WIFI   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>`;
const ICON_X_CIRC= `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

const FREEZE_MS   = 8_000; // Bu kadar süre frame gelmezse kamerayı reset et
const FREEZE_CHECK= 2_000; // Freeze kontrolü aralığı

export class QRScanner extends BaseComponent {
  private onResult: QRResult;
  private onCancel: QRCancel;
  private type:     'in' | 'out';

  private stream:   MediaStream | null = null;
  private raf:      number | null = null;
  private stopped   = false;
  private _starting = false;

  private _lastFrameMs  = 0;
  private _freezeTimer: ReturnType<typeof setInterval> | null = null;
  private _visibilityHandler: (() => void) | null = null;

  constructor(onResult: QRResult, onCancel: QRCancel, type: 'in' | 'out' = 'in') {
    super({});
    this.onResult = onResult;
    this.onCancel = onCancel;
    this.type     = type;
  }

  template(): string {
    const label = this.type === 'in' ? 'Giriş' : 'Çıkış';
    return `
      <div class="qr-scanner-overlay">
        <div class="qr-scanner-wrap">

          <div class="qr-scanner-topbar">
            <h2 class="qr-scanner-title">
              ${ICON_QR} ${label} Taraması
            </h2>
            <button class="qr-close-btn" aria-label="Kapat">
              ${ICON_X_CIRC}
            </button>
          </div>

          <div class="qr-scanner-box">
            <div class="qr-video-wrapper">
              <video class="qr-video" autoplay playsinline muted></video>
              <canvas class="qr-canvas" style="display:none"></canvas>

              <div class="qr-error-state" style="display:none">
                <div class="qr-error-icon">${ICON_CAM_OFF}</div>
                <h3 class="qr-error-title">Kamera Engellendi</h3>
                <p class="qr-error-desc">
                  Adres çubuğundaki <strong>kilit</strong> ikonuna tıklayıp kameraya izin verin.
                </p>
                <button class="qr-reload-btn" id="qr-reload-btn">İzin Verdim, Yenile</button>
              </div>

              <div class="qr-corners" aria-hidden="true">
                <div class="qr-corner qr-corner--tl"></div>
                <div class="qr-corner qr-corner--tr"></div>
                <div class="qr-corner qr-corner--bl"></div>
                <div class="qr-corner qr-corner--br"></div>
              </div>
              <div class="qr-scan-line" aria-hidden="true"></div>
            </div>

            <p class="qr-hint">QR Kodu Merkeze Getirin</p>
          </div>

          <div class="qr-scanner-warning">
            ${ICON_WIFI}
            <span>Sadece iş yeri Wi-Fi ağına bağlıyken tarama yapabilirsiniz.</span>
          </div>

        </div>
      </div>`;
  }

  afterMount() {
    const header = document.getElementById('header-container');
    if (header) header.style.display = 'none';

    (this.el.querySelector('.qr-close-btn') as HTMLElement).onclick = () => {
      this._stop();
      this._restoreHeader();
      this.onCancel();
      this.unmount();
    };
    const reloadBtn = this.el.querySelector('#qr-reload-btn') as HTMLElement | null;
    if (reloadBtn) reloadBtn.onclick = () => location.reload();

    // Tab gizlenince stream'i serbest bırak, görününce yeniden başlat
    this._visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this._stopStream();
      } else if (!this.stopped) {
        this._restartCamera();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this._startCamera();
  }

  private _restoreHeader() {
    const header = document.getElementById('header-container');
    if (header) header.style.display = '';
  }

  // Sadece stream + RAF durdurur — scanner'ı tamamen kapatmaz
  private _stopStream() {
    if (this.raf !== null) { cancelAnimationFrame(this.raf); this.raf = null; }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this._freezeTimer) { clearInterval(this._freezeTimer); this._freezeTimer = null; }
  }

  private async _restartCamera() {
    this._stopStream();
    if (this.stopped) return;
    // iOS'ta kısa bekleme olmadan yeni getUserMedia başarısız olabiliyor
    await new Promise<void>(r => setTimeout(r, 400));
    if (this.stopped) return;
    await this._startCamera();
  }

  private async _startCamera() {
    if (this._starting || this.stopped) return;
    this._starting = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      if (this.stopped || !this.el) { this._stopStream(); return; }
      const video = this.el.querySelector('.qr-video') as HTMLVideoElement | null;
      if (!video) { this._stopStream(); return; }
      video.srcObject = this.stream;
      await video.play();
      this._scan(video);
    } catch {
      this._stopStream();
      if (!this.el) return;
      const errEl = this.el.querySelector('.qr-error-state') as HTMLElement | null;
      const video = this.el.querySelector('.qr-video') as HTMLElement | null;
      if (errEl) errEl.style.display = 'flex';
      if (video) video.style.display = 'none';
    } finally {
      this._starting = false;
    }
  }

  private _scan(video: HTMLVideoElement) {
    if (!this.el) return;
    const canvas = this.el.querySelector('.qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Freeze watcher: FREEZE_CHECK ms'de bir kontrol, FREEZE_MS süredir frame yoksa restart
    this._lastFrameMs = Date.now();
    this._freezeTimer = setInterval(() => {
      if (!this.stopped && Date.now() - this._lastFrameMs > FREEZE_MS) {
        this._restartCamera();
      }
    }, FREEZE_CHECK);

    const tick = () => {
      if (this.stopped) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        this._lastFrameMs = Date.now(); // canlı frame — freeze timer'ı sıfırla
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr  = jsQR(img.data, img.width, img.height);
        if (qr?.data) {
          this._stop();
          this._restoreHeader();
          this.unmount();
          this.onResult(qr.data);
          return;
        }
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  // Scanner tamamen kapatılıyor (başarı veya kullanıcı iptali)
  private _stop() {
    this.stopped = true;
    this._stopStream();
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }

  unmount() {
    this._stop();
    super.unmount();
  }

  static open(_container: HTMLElement, type: 'in' | 'out'): Promise<string | null> {
    return new Promise((resolve) => {
      const scanner = new QRScanner(
        (value) => resolve(value),
        ()      => resolve(null),
        type,
      );
      scanner.mount(document.body);
    });
  }
}
