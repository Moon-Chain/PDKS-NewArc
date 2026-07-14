import { bus } from './EventBus.js';

type SSEHandler = (data: unknown) => void;

class EventStream {
  private es: EventSource | null = null;
  private retryDelay = 3000;
  private maxRetry   = 30_000;
  private _stopped   = true;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.es) return;
    this._stopped = false;
    this._open();
  }

  disconnect() {
    this._stopped = true;
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    this.es?.close();
    this.es = null;
    this.retryDelay = 3000;
  }

  private _open() {
    if (this._stopped) return;
    this.es = new EventSource('/api/v1/events', { withCredentials: true });

    this.es.addEventListener('connected', () => {
      this.retryDelay = 3000;
      bus.emit('sse:connected', null);
    });

    this.es.addEventListener('attendance', (e: MessageEvent) => {
      try { bus.emit('sse:attendance', JSON.parse(e.data)); } catch {}
    });

    this.es.addEventListener('notification', (e: MessageEvent) => {
      try { bus.emit('sse:notification', JSON.parse(e.data)); } catch {}
    });

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (this._stopped) return;
      bus.emit('sse:disconnected', null);
      this._retryTimer = setTimeout(() => this._open(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetry);
    };
  }
}

export const eventStream = new EventStream();
