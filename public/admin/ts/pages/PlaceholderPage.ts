import { BasePage } from '../../../ts/core/BasePage.js';
import { icon } from '../icons.js';

/**
 * Henüz portu yapılmamış / kilitli admin modülleri için kart görünümü.
 * admin-panel-preview/js/admin.js'teki lockedModule() ile aynı yapı (.card.locked-module).
 */
export function makeAdminPlaceholder(title: string, note: string): new (container: HTMLElement) => BasePage {
  return class extends BasePage {
    async render(): Promise<void> {
      this.container.innerHTML = `
        <div class="card locked-module">
          <div class="lock-icon">${icon('lock', 'icon icon-lg')}</div>
          <h3>${title}</h3>
          <p>${note}</p>
        </div>
      `;
    }
  };
}
