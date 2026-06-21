/* ==========================================================================
   <c-image-zoom>
   Tıklanınca overlay'de tam ekran açılan resim bileşeni.
   ESC veya overlay dışına tıklayarak kapatılır.

   Attribute'lar:
     src     - resim yolu (zorunlu)
     alt     - erişilebilirlik açıklaması (opsiyonel)
     caption - resmin altında gösterilecek açıklama (opsiyonel)

   Kullanım:
     <c-image-zoom src="screenshot.png" alt="Ekran görüntüsü" caption="Bileşen önizlemesi"></c-image-zoom>
   ========================================================================== */

class CImageZoom extends HTMLElement {
    connectedCallback() {
        const src     = this.getAttribute('src')     || '';
        const alt     = this.getAttribute('alt')     || '';
        const caption = this.getAttribute('caption') || '';

        this.classList.add('c-image-zoom');

        const img = document.createElement('img');
        img.src       = src;
        img.alt       = alt;
        img.className = 'c-image-zoom__thumb';
        img.setAttribute('role',     'button');
        img.setAttribute('tabindex', '0');

        this.appendChild(img);

        if (caption) {
            const figcap = document.createElement('figcaption');
            figcap.className   = 'c-image-zoom__caption';
            figcap.textContent = caption;
            this.appendChild(figcap);
        }

        img.addEventListener('click',   () => this._open(src, alt));
        img.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') this._open(src, alt);
        });
    }

    _open(src, alt) {
        const overlay = document.createElement('div');
        overlay.className = 'c-image-zoom__overlay';

        const closeBtn = document.createElement('button');
        closeBtn.className   = 'c-image-zoom__close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Kapat');

        const fullImg = document.createElement('img');
        fullImg.src       = src;
        fullImg.alt       = alt;
        fullImg.className = 'c-image-zoom__full';

        overlay.appendChild(closeBtn);
        overlay.appendChild(fullImg);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const close = () => {
            overlay.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        };

        const onKey = e => { if (e.key === 'Escape') close(); };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', onKey);
    }
}

customElements.define('c-image-zoom', CImageZoom);
