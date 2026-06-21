/* ==========================================================================
   <c-theme-toggle>
   Açık/koyu tema arasında geçiş yapan buton. Seçim <html data-theme="...">
   attribute'una yazılır (tokens.css buna göre değişken setini değiştirir) ve
   localStorage'da saklanır.

   Kullanım: <c-theme-toggle></c-theme-toggle>
   ========================================================================== */

class CThemeToggle extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<button type="button" class="c-theme-toggle__btn"></button>`;
        this.button = this.querySelector('button');
        this.button.addEventListener('click', () => this.toggle());
        this.applyStoredTheme();
    }

    applyStoredTheme() {
        const stored = localStorage.getItem('c-theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
    }

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        this.setTheme(current === 'dark' ? 'light' : 'dark');
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('c-theme', theme);
        this.button.textContent = theme === 'dark' ? '☀️' : '🌙';
        this.button.setAttribute('aria-label', theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
        this.button.title = this.button.getAttribute('aria-label');
    }
}

customElements.define('c-theme-toggle', CThemeToggle);
