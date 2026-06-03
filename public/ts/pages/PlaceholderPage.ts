import { BasePage } from '../core/BasePage.js';

export function makePlaceholder(title: string, icon: string): typeof BasePage {
  return class extends BasePage {
    async render(): Promise<void> {
      this.container.innerHTML = `
        <div class="placeholder-page">
          <div class="placeholder-icon">${icon}</div>
          <h2 class="placeholder-title">${title}</h2>
          <p class="placeholder-desc">Bu bölüm yapım aşamasında.<br>Yakında burada olacak.</p>
        </div>
      `;
    }
  };
}
