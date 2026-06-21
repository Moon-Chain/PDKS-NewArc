/* ==========================================================================
   <c-heading-anchor>
   .page-inner içindeki tüm h2/h3/h4 başlıklarına # anchor linki ekler.
   Fare üzerine gelince görünür, tıklayınca hash URL'yi panoya kopyalar.
   Invisible yardımcı element — sayfa başına bir kez eklenir.

   Kullanım:
     <c-heading-anchor></c-heading-anchor>
   ========================================================================== */

class CHeadingAnchor extends HTMLElement {
    connectedCallback() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        const scope    = document.querySelector('.page-inner') || document.body;
        const headings = Array.from(scope.querySelectorAll('h2, h3, h4'));

        headings.forEach((h, i) => {
            if (!h.id) {
                h.id = this._slug(h.textContent) || `section-${i}`;
            }
            if (h.querySelector('.c-heading-anchor__link')) return;

            const a = document.createElement('a');
            a.className = 'c-heading-anchor__link';
            a.href      = `#${h.id}`;
            a.setAttribute('aria-label', 'Bu bölüme bağlantı kopyala');
            a.textContent = '#';

            a.addEventListener('click', e => {
                e.preventDefault();
                const url = `${location.origin}${location.pathname}#${h.id}`;
                navigator.clipboard?.writeText(url);
                history.replaceState(null, '', `#${h.id}`);
                a.classList.add('c-heading-anchor__link--copied');
                setTimeout(() => a.classList.remove('c-heading-anchor__link--copied'), 1400);
            });

            h.classList.add('c-heading-anchor__heading');
            h.appendChild(a);
        });
    }

    _slug(text) {
        return text.trim()
            .toLowerCase()
            .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
            .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
            .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    }
}

customElements.define('c-heading-anchor', CHeadingAnchor);
