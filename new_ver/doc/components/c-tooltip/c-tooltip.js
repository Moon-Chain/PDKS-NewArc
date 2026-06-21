/* ==========================================================================
   <c-tooltip>
   Hover tooltip. İçeriği gösterir, üzerine gelindiğinde açıklama balonu çıkar.
   Saf CSS ile çalışır — JS sadece yapıyı kurar.

   Attribute'lar:
     text     - tooltip içeriği (zorunlu)
     position - top | bottom | left | right (varsayılan: top)

   Kullanım:
     <c-tooltip text="Açıklama metni">Üzerine gelin</c-tooltip>
   ========================================================================== */

class CTooltip extends HTMLElement {
    connectedCallback() {
        const text     = this.getAttribute('text') || '';
        const position = this.getAttribute('position') || 'top';

        this.classList.add('c-tooltip', `c-tooltip--${position}`);

        const trigger = document.createElement('span');
        trigger.className = 'c-tooltip__trigger';
        trigger.append(...Array.from(this.childNodes));

        const tip = document.createElement('span');
        tip.className = 'c-tooltip__tip';
        tip.textContent = text;
        tip.setAttribute('role', 'tooltip');

        this.innerHTML = '';
        this.appendChild(trigger);
        this.appendChild(tip);
    }
}

customElements.define('c-tooltip', CTooltip);
