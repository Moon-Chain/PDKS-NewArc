/* ==========================================================================
   <c-navbar>
   Üstte sabit gezinme çubuğu: logo/başlık, tema anahtarı, GitHub linki ve
   mobilde sidebar'ı açıp kapatan hamburger butonu.

   Attribute'lar:
     brand        - başlık metni (varsayılan: "Component Galerisi")
     home         - logoya tıklayınca gidilecek link (varsayılan: "../index.html")
     github-url   - GitHub butonunun linki (varsayılan: "#")

   Mobil hamburger butonu, document üzerinde "c-sidebar-toggle" custom event'i
   tetikler; <c-sidebar> bu event'i dinleyip kendini açar/kapatır.

   Kullanım: <c-navbar brand="Docs" home="../index.html"></c-navbar>
   ========================================================================== */

class CNavbar extends HTMLElement {
    connectedCallback() {
        const brand     = this.getAttribute('brand')      || window.PROJECT?.brand  || 'Component Galerisi';
        const home      = this.getAttribute('home')       || '../index.html';
        const githubUrl = this.getAttribute('github-url') || window.PROJECT?.github || '#';

        this.innerHTML = `
            <header class="c-navbar">
                <button type="button" class="c-navbar__burger" aria-label="Menüyü aç/kapat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
                    </svg>
                </button>
                <a href="${home}" class="c-navbar__brand">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="c-navbar__logo" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                        <path d="M8.646 6.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 9 8.646 7.354a.5.5 0 0 1 0-.708zm-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 9l1.647-1.646a.5.5 0 0 0 0-.708z" />
                    </svg>
                    <span class="c-navbar__title">${brand}</span>
                </a>
                <div class="c-navbar__actions">
                    <c-theme-toggle></c-theme-toggle>
                    <a href="${githubUrl}" class="c-navbar__github" target="_blank" rel="noopener">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        GitHub
                    </a>
                </div>
            </header>
        `;

        this.querySelector('.c-navbar__burger').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('c-sidebar-toggle'));
        });
    }
}

customElements.define('c-navbar', CNavbar);
