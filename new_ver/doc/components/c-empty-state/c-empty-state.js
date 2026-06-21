/* ==========================================================================
   <c-empty-state>
   Boş liste, sonuçsuz arama gibi durumlar için placeholder bileşeni.

   Attribute'lar:
     icon        - Emoji veya kısa metin; verilmezse varsayılan SVG gösterilir
     title       - Başlık (varsayılan: "İçerik bulunamadı")
     description - Alt açıklama metni
     size        - sm | md | lg (varsayılan: md)

   Slot:
     action      - İsteğe bağlı aksiyon butonu / bağlantı

   Kullanım:
     <c-empty-state
       icon="🔍"
       title="Sonuç bulunamadı"
       description="Farklı bir arama terimi deneyin.">
       <button slot="action">Temizle</button>
     </c-empty-state>
   ========================================================================== */

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 12h-6l-2 3H10l-2-3H2"/>
  <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
</svg>`;

class CEmptyState extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const icon        = this.getAttribute('icon') || '';
        const title       = this.getAttribute('title') || 'İçerik bulunamadı';
        const description = this.getAttribute('description') || '';
        const size        = this.getAttribute('size') || 'md';
        const actionSlot  = this.querySelector('[slot="action"]');

        this.classList.add('c-empty-state', `c-empty-state--${size}`);
        this.innerHTML = '';

        const iconEl = document.createElement('div');
        iconEl.className = 'c-empty-state__icon';
        if (icon) {
            iconEl.textContent = icon;
            iconEl.classList.add('c-empty-state__icon--emoji');
        } else {
            iconEl.innerHTML = DEFAULT_SVG;
        }
        this.appendChild(iconEl);

        const titleEl = document.createElement('p');
        titleEl.className = 'c-empty-state__title';
        titleEl.textContent = title;
        this.appendChild(titleEl);

        if (description) {
            const descEl = document.createElement('p');
            descEl.className = 'c-empty-state__description';
            descEl.textContent = description;
            this.appendChild(descEl);
        }

        if (actionSlot) {
            const actionWrap = document.createElement('div');
            actionWrap.className = 'c-empty-state__action';
            actionSlot.removeAttribute('slot');
            actionWrap.appendChild(actionSlot);
            this.appendChild(actionWrap);
        }
    }
}

customElements.define('c-empty-state', CEmptyState);
