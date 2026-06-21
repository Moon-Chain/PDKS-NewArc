/* ==========================================================================
   <c-icon-gallery>
   SVG ikon grid'i. JSON manifest'ten ikonları yükler; tıklanınca SVG kodunu
   panoya kopyalar.

   Attribute'lar:
     src  — icons.json dosyasının yolu (zorunlu)
     size — ikon görsel boyutu, px cinsinden (varsayılan: 24)

   icons.json formatı:
     [{ "name": "arrow-left", "inner": "<path d=\"...\" fill=\"none\"/>" }, ...]

   Kullanım: <c-icon-gallery src="../assets/icons/icons.json"></c-icon-gallery>
   ========================================================================== */

class CIconGallery extends HTMLElement {
    async connectedCallback() {
        const src  = this.getAttribute('src')  || '';
        const size = this.getAttribute('size') || '24';

        this.classList.add('c-icon-gallery');
        this.innerHTML = '<p class="c-icon-gallery__loading">Yükleniyor…</p>';

        let icons = [];
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(res.status);
            icons = await res.json();
        } catch (e) {
            this.innerHTML = `<p class="c-icon-gallery__error">İkonlar yüklenemedi: <code>${src}</code></p>`;
            return;
        }

        this.innerHTML = `
            <div class="c-icon-gallery__grid">
                ${icons.map(icon => `
                    <button class="c-icon-gallery__item" data-name="${icon.name}" title="${icon.name} — kopyalamak için tıkla">
                        <svg class="c-icon-gallery__svg" xmlns="http://www.w3.org/2000/svg"
                             viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
                            ${icon.inner}
                        </svg>
                        <span class="c-icon-gallery__name">${icon.name}</span>
                    </button>
                `).join('')}
            </div>
            <p class="c-icon-gallery__toast" aria-live="polite"></p>
        `;

        this.querySelectorAll('.c-icon-gallery__item').forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = icons.find(i => i.name === btn.dataset.name);
                if (!icon) return;
                const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  ${icon.inner}\n</svg>`;
                navigator.clipboard.writeText(svgText).then(() => {
                    btn.classList.add('c-icon-gallery__item--copied');
                    setTimeout(() => btn.classList.remove('c-icon-gallery__item--copied'), 1500);
                    const toast = this.querySelector('.c-icon-gallery__toast');
                    toast.textContent = `"${icon.name}" kopyalandı`;
                    clearTimeout(this._timer);
                    this._timer = setTimeout(() => { toast.textContent = ''; }, 2200);
                });
            });
        });
    }
}

customElements.define('c-icon-gallery', CIconGallery);
