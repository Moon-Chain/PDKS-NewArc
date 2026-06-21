/* ==========================================================================
   <c-card>
   Başlık / içerik / footer alanlı kart. "header" ve "footer" alanları,
   slot="header" / slot="footer" attribute'u taşıyan doğrudan çocuk
   element'lerden alınır; bunların dışındaki tüm çocuklar gövde (body) olur.

   Kullanım:
     <c-card>
       <div slot="header">Başlık</div>
       <p>Gövde içeriği...</p>
       <div slot="footer">Footer içeriği</div>
     </c-card>
   ========================================================================== */

class CCard extends HTMLElement {
    connectedCallback() {
        const children = Array.from(this.children);
        const header = children.find(c => c.getAttribute('slot') === 'header');
        const footer = children.find(c => c.getAttribute('slot') === 'footer');
        const bodyChildren = children.filter(c => c !== header && c !== footer);

        const card = document.createElement('div');
        card.className = 'c-card';

        // Çocuk node'lar taşınır (innerHTML string'ine çevirmek, içindeki
        // <c-code-block> gibi upgrade olmuş component'lerin state/listener'larını kaybettirir)
        if (header) {
            const headerEl = document.createElement('div');
            headerEl.className = 'c-card__header';
            headerEl.append(...Array.from(header.childNodes));
            card.appendChild(headerEl);
        }

        const body = document.createElement('div');
        body.className = 'c-card__body';
        body.append(...bodyChildren);
        card.appendChild(body);

        if (footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'c-card__footer';
            footerEl.append(...Array.from(footer.childNodes));
            card.appendChild(footerEl);
        }

        this.innerHTML = '';
        this.appendChild(card);
    }
}

customElements.define('c-card', CCard);
