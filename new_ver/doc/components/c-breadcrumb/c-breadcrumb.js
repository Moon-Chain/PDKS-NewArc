/* ==========================================================================
   <c-breadcrumb>
   Sayfa konum bilgisi (breadcrumb). "items" attribute'u, ">" ile ayrılmış
   adımlardan oluşur. Her adım "Etiket" veya "Etiket|href" şeklinde yazılır.
   href verilmeyen (genelde son) adım, aktif/güncel sayfa olarak gösterilir.

   Kullanım:
     <c-breadcrumb items="Component Galerisi|../index.html>Callout"></c-breadcrumb>
   ========================================================================== */

class CBreadcrumb extends HTMLElement {
    connectedCallback() {
        const raw = this.getAttribute('items') || '';
        const steps = raw.split('>').map(s => s.trim()).filter(Boolean);

        const itemsHtml = steps.map((step, index) => {
            const [label, href] = step.split('|').map(s => s.trim());
            const isLast = index === steps.length - 1;

            if (isLast || !href) {
                return `<li class="c-breadcrumb__item c-breadcrumb__item--active" aria-current="page">${label}</li>`;
            }
            return `<li class="c-breadcrumb__item"><a href="${href}">${label}</a></li>`;
        }).join('');

        this.innerHTML = `<nav aria-label="breadcrumb"><ol class="c-breadcrumb">${itemsHtml}</ol></nav>`;
    }
}

customElements.define('c-breadcrumb', CBreadcrumb);
