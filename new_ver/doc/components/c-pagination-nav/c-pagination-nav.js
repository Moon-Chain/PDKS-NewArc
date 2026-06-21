/* ==========================================================================
   <c-pagination-nav>
   Sayfa altında "← Önceki | Sonraki →" gezinme linkleri.

   Attribute'lar:
     prev-href, prev-label - önceki sayfa linki ve etiketi (yoksa gösterilmez)
     next-href, next-label - sonraki sayfa linki ve etiketi (yoksa gösterilmez)

   Kullanım:
     <c-pagination-nav
       prev-href="callout.html" prev-label="Callout"
       next-href="card.html" next-label="Card">
     </c-pagination-nav>
   ========================================================================== */

class CPaginationNav extends HTMLElement {
    connectedCallback() {
        const prevHref = this.getAttribute('prev-href');
        const prevLabel = this.getAttribute('prev-label') || 'Önceki';
        const nextHref = this.getAttribute('next-href');
        const nextLabel = this.getAttribute('next-label') || 'Sonraki';

        const prevHtml = prevHref
            ? `<a href="${prevHref}" class="c-pagination-nav__link c-pagination-nav__link--prev">
                   <span class="c-pagination-nav__direction">&larr; Önceki</span>
                   <span class="c-pagination-nav__label">${prevLabel}</span>
               </a>`
            : '<span></span>';

        const nextHtml = nextHref
            ? `<a href="${nextHref}" class="c-pagination-nav__link c-pagination-nav__link--next">
                   <span class="c-pagination-nav__direction">Sonraki &rarr;</span>
                   <span class="c-pagination-nav__label">${nextLabel}</span>
               </a>`
            : '<span></span>';

        this.innerHTML = `<nav class="c-pagination-nav">${prevHtml}${nextHtml}</nav>`;
    }
}

customElements.define('c-pagination-nav', CPaginationNav);
