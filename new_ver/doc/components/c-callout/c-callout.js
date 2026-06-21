/* ==========================================================================
   <c-callout>
   Dikkat çekici bilgi kutusu.

   Attribute'lar:
     variant - info | warning | danger | success | primary | secondary | dark
               (boş bırakılırsa varsayılan/nötr renk)
     title   - opsiyonel başlık (h5)

   İçerik (innerHTML) callout gövdesi olarak gösterilir.

   Kullanım:
     <c-callout variant="warning" title="Uyarı">Mesaj metni...</c-callout>
   ========================================================================== */

class CCallout extends HTMLElement {
    connectedCallback() {
        const variant = this.getAttribute('variant') || '';
        const title = this.getAttribute('title');

        this.classList.add('c-callout');
        if (variant) {
            this.classList.add(`c-callout--${variant}`);
        }

        // Mevcut çocuk node'ları taşı (innerHTML string'ine çevirmek, içindeki
        // <c-code-block> gibi upgrade olmuş component'lerin state/listener'larını kaybettirir)
        const body = document.createElement('div');
        body.className = 'c-callout__body';
        body.append(...Array.from(this.childNodes));

        this.innerHTML = '';

        if (title) {
            const heading = document.createElement('h5');
            heading.className = 'c-callout__title';
            heading.textContent = title;
            this.appendChild(heading);
        }

        this.appendChild(body);
    }
}

customElements.define('c-callout', CCallout);
