/* ==========================================================================
   <c-banner>
   Sayfa üstü duyuru çubuğu. Deprecation, beta, breaking change uyarıları için.

   Attribute'lar:
     variant     — info | warning | danger | success | beta (varsayılan: info)
     dismissible — varlığı yeterli; kapat butonu gösterir
     message     — metin içerik; verilmezse element içeriği kullanılır (HTML destekler)
     persist-key — localStorage key; kapatılınca bir daha göstermez

   Kullanım:
     <c-banner variant="warning" dismissible message="Bu API kaldırılacak."></c-banner>

     <c-banner variant="beta" dismissible persist-key="beta-notice-v1">
       Bu özellik beta aşamasındadır. <a href="#">Geri bildirim</a>
     </c-banner>
   ========================================================================== */

class CBanner extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const variant    = this.getAttribute('variant')     || 'info';
        const dismissible = this.hasAttribute('dismissible');
        const message    = this.getAttribute('message')     || this.innerHTML.trim();
        const persistKey = this.getAttribute('persist-key') || '';

        if (persistKey && localStorage.getItem(persistKey) === 'dismissed') {
            this.hidden = true;
            return;
        }

        const icons = { info: 'ℹ', warning: '⚠', danger: '✕', success: '✓', beta: 'β' };

        this.classList.add('c-banner', `c-banner--${variant}`);
        this.innerHTML = `
            <span class="c-banner__icon" aria-hidden="true">${icons[variant] ?? icons.info}</span>
            <span class="c-banner__text">${message}</span>
            ${dismissible
                ? `<button class="c-banner__close" aria-label="Bildirimi kapat">&times;</button>`
                : ''}
        `;

        if (dismissible) {
            this.querySelector('.c-banner__close').addEventListener('click', () => {
                this.hidden = true;
                if (persistKey) localStorage.setItem(persistKey, 'dismissed');
            });
        }
    }
}

customElements.define('c-banner', CBanner);
