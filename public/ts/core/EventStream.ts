import { bus } from './EventBus.js';

type SSEHandler = (data: unknown) => void;

class EventStream {
  private es: EventSource | null = null;
  private retryDelay = 3000;
  private maxRetry   = 30_000;

  connect() {
    if (this.es) return;
    this._open();
  }

  disconnect() {
    this.es?.close();
    this.es = null;
  }

  private _open() {
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
      bus.emit('sse:disconnected', null);

      // Exponential backoff ile yeniden bağlan
      setTimeout(() => this._open(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetry);
    };
  }
}

export const eventStream = new EventStream();
