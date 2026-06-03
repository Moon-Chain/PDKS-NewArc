type ToastType = 'success' | 'error' | 'warning' | 'info';

export class Toast {
  private el: HTMLElement;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(message: string, type: ToastType = 'success', duration = 3000) {
    this.el = document.createElement('div');
    this.el.className = `toast toast-${type}`;
    this.el.textContent = message;

    const container = document.getElementById('toast-container');
    if (!container) return;

    container.appendChild(this.el);

    this.timer = setTimeout(() => this.remove(), duration);
    this.el.addEventListener('click', () => this.remove());
  }

  remove() {
    if (this.timer) clearTimeout(this.timer);
    this.el.remove();
  }

  static show(message: string, type: ToastType = 'success', duration = 3000) {
    new Toast(message, type, duration);
  }
}
