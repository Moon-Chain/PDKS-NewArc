/* ==========================================================================
   <c-print-button>
   Sayfayı temiz CSS print stilleriyle yazdıran buton.
   Baskıda navbar, sidebar ve yardımcı elementler gizlenir;
   içerik tam genişliğe çıkar ve linkler href'leriyle yazılır.

   Attribute'lar:
     label - buton etiketi (varsayılan: "Sayfayı Yazdır")

   Kullanım:
     <c-print-button></c-print-button>
     <c-print-button label="PDF Olarak Kaydet"></c-print-button>
   ========================================================================== */

class CPrintButton extends HTMLElement {
    connectedCallback() {
        const label = this.getAttribute('label') || 'Sayfayı Yazdır';

        this.classList.add('c-print-button');

        const btn = document.createElement('button');
        btn.type        = 'button';
        btn.className   = 'c-print-button__btn';
        btn.textContent = label;
        btn.addEventListener('click', () => window.print());

        this.innerHTML = '';
        this.appendChild(btn);

        if (!document.getElementById('c-print-styles')) {
            const style = document.createElement('style');
            style.id = 'c-print-styles';
            style.textContent = `
@media print {
    c-navbar, c-sidebar, c-pagination-nav,
    c-feedback, c-print-button, c-search-box { display: none !important; }
    .page { padding-left: 0 !important; }
    .page-inner { padding: 0 !important; }
    a[href]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: #666; }
    pre { white-space: pre-wrap; word-break: break-all; }
}`;
            document.head.appendChild(style);
        }
    }
}

customElements.define('c-print-button', CPrintButton);
