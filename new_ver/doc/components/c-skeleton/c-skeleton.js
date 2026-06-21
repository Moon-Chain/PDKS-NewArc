/* ==========================================================================
   <c-skeleton>
   Yükleniyor durumu için içerik placeholder'ı (shimmer animasyonlu).

   Attribute'lar:
     variant - rect | circle | text  (varsayılan: rect)
     width   - CSS genişlik değeri, örn. "200px" veya "60%"  (rect)
     height  - CSS yükseklik değeri, örn. "1rem"              (rect, varsayılan: 1rem)
     size    - Çap CSS değeri, örn. "48px"                    (circle)
     lines   - Satır sayısı                                   (text, varsayılan: 3)

   Kullanım:
     <c-skeleton variant="text" lines="3"></c-skeleton>
     <c-skeleton variant="circle" size="48px"></c-skeleton>
     <c-skeleton width="100%" height="160px"></c-skeleton>
   ========================================================================== */

class CSkeleton extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const variant = this.getAttribute('variant') || 'rect';
        this.classList.add('c-skeleton');

        if (variant === 'text') {
            const lines = parseInt(this.getAttribute('lines') || '3', 10);
            this.classList.add('c-skeleton--text');
            this.innerHTML = Array.from({ length: lines }, (_, i) => {
                const short = i === lines - 1 && lines > 1;
                return `<span class="c-skeleton__line${short ? ' c-skeleton__line--short' : ''}"></span>`;
            }).join('');

        } else if (variant === 'circle') {
            const size = this.getAttribute('size') || '48px';
            this.classList.add('c-skeleton--circle');
            this.style.setProperty('--c-skeleton-size', size);

        } else {
            const width  = this.getAttribute('width');
            const height = this.getAttribute('height') || '1rem';
            this.classList.add('c-skeleton--rect');
            if (width) this.style.width = width;
            this.style.height = height;
        }
    }
}

customElements.define('c-skeleton', CSkeleton);
