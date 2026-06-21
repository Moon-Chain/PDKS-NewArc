/* ==========================================================================
   <c-kbd>
   Klavye kısayolu gösterimi. Inline element; metin içinde kullanılabilir.
   "+" karakteriyle ayrılmış tuşları ayrı .c-kbd__key span'larına böler.

   Kullanım:
     <c-kbd>Ctrl+K</c-kbd>
     <c-kbd>⌘+Shift+P</c-kbd>
     <c-kbd>Enter</c-kbd>
   ========================================================================== */

class CKbd extends HTMLElement {
    connectedCallback() {
        const text = this.textContent.trim();
        this.textContent = '';
        this.classList.add('c-kbd');

        text.split('+').forEach((part, i, arr) => {
            if (i > 0) {
                const sep = document.createElement('span');
                sep.className = 'c-kbd__sep';
                sep.textContent = '+';
                this.appendChild(sep);
            }
            const key = document.createElement('kbd');
            key.className = 'c-kbd__key';
            key.textContent = part.trim();
            this.appendChild(key);
        });
    }
}

customElements.define('c-kbd', CKbd);
