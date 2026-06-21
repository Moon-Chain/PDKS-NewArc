/* ==========================================================================
   <c-copy-button>
   Bağımsız kopyala butonu. c-code-block'tan bağımsız olarak herhangi bir
   metin veya element içeriğini panoya kopyalar.

   Attribute'lar:
     text   - doğrudan kopyalanacak metin
     target - CSS seçici; o elementin textContent'i kopyalanır
     label  - buton etiketi (varsayılan: "Kopyala")

   Kullanım:
     <c-copy-button text="npm install legacy-doc"></c-copy-button>
     <c-copy-button target="#snippet" label="Kodu Kopyala"></c-copy-button>
   ========================================================================== */

class CCopyButton extends HTMLElement {
    connectedCallback() {
        const label  = this.getAttribute('label')  || 'Kopyala';
        const text   = this.getAttribute('text')   || '';
        const target = this.getAttribute('target') || '';

        this.classList.add('c-copy-button');

        const btn = document.createElement('button');
        btn.type        = 'button';
        btn.className   = 'c-copy-button__btn';
        btn.textContent = label;

        btn.addEventListener('click', async () => {
            let content = text;
            if (!content && target) {
                const el = document.querySelector(target);
                content = el ? el.textContent.trim() : '';
            }
            if (!content) return;

            try {
                await navigator.clipboard.writeText(content);
            } catch (_) { return; }

            btn.textContent = 'Kopyalandı';
            btn.classList.add('c-copy-button__btn--copied');
            setTimeout(() => {
                btn.textContent = label;
                btn.classList.remove('c-copy-button__btn--copied');
            }, 1200);
        });

        this.innerHTML = '';
        this.appendChild(btn);
    }
}

customElements.define('c-copy-button', CCopyButton);
