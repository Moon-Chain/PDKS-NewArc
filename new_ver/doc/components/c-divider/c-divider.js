/* ==========================================================================
   <c-divider>
   Etiketli veya düz yatay ayırıcı çizgi.

   Attribute'lar:
     label - ortadaki metin (yoksa düz çizgi)

   Kullanım:
     <c-divider label="veya"></c-divider>
     <c-divider></c-divider>
   ========================================================================== */

class CDivider extends HTMLElement {
    connectedCallback() {
        const label = this.getAttribute('label') || '';
        this.classList.add('c-divider');

        if (label) {
            this.classList.add('c-divider--labeled');
            this.innerHTML = `<span class="c-divider__label">${label}</span>`;
        } else {
            this.innerHTML = '';
        }
    }
}

customElements.define('c-divider', CDivider);
