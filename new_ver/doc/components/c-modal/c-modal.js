/* ==========================================================================
   <c-modal>
   Overlay diyalog kutusu. element.open() / element.close() ile kontrol edilir.
   ESC tuşu ve backdrop tıklaması kapatır.

   Attribute'lar:
     title  - modal başlık çubuğundaki metin
     width  - max genişlik (varsayılan: 520px)

   Metodlar:
     open()  - modalı açar, body scroll'unu kilitler
     close() - modalı kapatır, scroll'u serbest bırakır

   Kullanım:
     <c-modal id="demo" title="Başlık">
       <p>İçerik buraya.</p>
     </c-modal>
     <button onclick="document.getElementById('demo').open()">Aç</button>
   ========================================================================== */

class CModal extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const title    = this.getAttribute('title') || '';
        const maxWidth = this.getAttribute('width') || '520px';
        const body     = this.innerHTML;

        this.classList.add('c-modal');
        this.innerHTML = `
            <div class="c-modal__backdrop"></div>
            <div class="c-modal__dialog" style="max-width:${maxWidth}">
                <div class="c-modal__header">
                    <span class="c-modal__title">${title}</span>
                    <button class="c-modal__close" aria-label="Kapat">&times;</button>
                </div>
                <div class="c-modal__body">${body}</div>
            </div>
        `;

        this.querySelector('.c-modal__close').addEventListener('click', () => this.close());
        this.querySelector('.c-modal__backdrop').addEventListener('click', () => this.close());

        this._onKey = e => { if (e.key === 'Escape' && this.hasAttribute('open')) this.close(); };
        document.addEventListener('keydown', this._onKey);
    }

    disconnectedCallback() {
        if (this._onKey) document.removeEventListener('keydown', this._onKey);
    }

    open() {
        this.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.removeAttribute('open');
        document.body.style.overflow = '';
    }
}

customElements.define('c-modal', CModal);
