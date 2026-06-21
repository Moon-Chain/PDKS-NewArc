/* ==========================================================================
   <c-alert>
   Kapatılabilir uyarı/bildirim kutusu.

   Attribute'lar:
     variant     - info | success | warning | danger | primary (varsayılan: info)
     dismissible - varsa, sağ üstte kapatma (×) butonu gösterilir

   Kullanım:
     <c-alert variant="success" dismissible>Kaydedildi!</c-alert>
   ========================================================================== */

class CAlert extends HTMLElement {
    connectedCallback() {
        const variant = this.getAttribute('variant') || 'info';
        const dismissible = this.hasAttribute('dismissible');

        this.classList.add('c-alert', `c-alert--${variant}`);
        this.setAttribute('role', 'alert');

        const body = document.createElement('div');
        body.className = 'c-alert__body';
        body.append(...Array.from(this.childNodes));

        this.innerHTML = '';
        this.appendChild(body);

        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'c-alert__close';
            closeBtn.setAttribute('aria-label', 'Kapat');
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => this.remove());
            this.appendChild(closeBtn);
        }
    }
}

customElements.define('c-alert', CAlert);
