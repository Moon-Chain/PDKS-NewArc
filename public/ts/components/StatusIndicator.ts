import { BaseComponent } from '../core/BaseComponent.js';

export interface StatusData {
  isInside:  boolean;
  lastEntry: { timestamp: string; type: 'in' | 'out' } | null;
}

export class StatusIndicator extends BaseComponent {
  private data: StatusData;

  constructor(data: StatusData) {
    super({});
    this.data = data;
  }

  template(): string {
    const { isInside, lastEntry } = this.data;
    const time = lastEntry
      ? new Date(lastEntry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : null;

    if (isInside) {
      return `
        <div class="status-indicator status-inside">
          <div class="status-dot"></div>
          <div class="status-text">
            <span class="status-label">İÇERİDESİN</span>
            ${time ? `<span class="status-time">Giriş: ${time}</span>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="status-indicator status-outside">
        <div class="status-dot"></div>
        <div class="status-text">
          <span class="status-label">DIŞARIDASIN</span>
          ${time ? `<span class="status-time">Son çıkış: ${time}</span>` : '<span class="status-time">Henüz giriş yapılmadı</span>'}
        </div>
      </div>
    `;
  }

  update(data: StatusData) {
    this.data = data;
    if (this.el) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.template();
      const newEl = wrapper.firstElementChild as HTMLElement;
      this.el.replaceWith(newEl);
      this.el = newEl;
    }
  }
}
