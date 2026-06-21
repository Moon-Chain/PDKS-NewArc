/* ==========================================================================
   <c-popover>
   Tıklamayla açılan zengin içerik balonu. Tooltip'ten farklı olarak
   her türlü HTML içerebilir, dışarıya tıklayınca veya ESC ile kapanır.

   Attribute'lar:
     position - top | bottom | left | right (varsayılan: bottom)

   Kullanım:
     <c-popover position="bottom">
       <button slot="trigger">Aç</button>
       <div slot="content">
         <strong>Başlık</strong>
         <p>Açıklama metni.</p>
       </div>
     </c-popover>
   ========================================================================== */

class CPopover extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const position  = this.getAttribute('position') || 'bottom';
        const triggerEl = this.querySelector('[slot="trigger"]');
        const contentEl = this.querySelector('[slot="content"]');

        this.classList.add('c-popover', `c-popover--${position}`);
        this.innerHTML = '';

        const triggerWrap = document.createElement('span');
        triggerWrap.className = 'c-popover__trigger';
        if (triggerEl) {
            triggerEl.removeAttribute('slot');
            triggerWrap.appendChild(triggerEl);
        }

        const panel = document.createElement('div');
        panel.className = 'c-popover__panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-hidden', 'true');
        if (contentEl) {
            contentEl.removeAttribute('slot');
            panel.appendChild(contentEl);
        }

        this.appendChild(triggerWrap);
        this.appendChild(panel);

        triggerWrap.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = panel.classList.contains('c-popover__panel--open');
            this._closeAll();
            if (!isOpen) this._open(panel);
        });

        /* Panel içinde tıklama yayılımı durdur (dışarı click ile kapanmasın) */
        panel.addEventListener('click', e => e.stopPropagation());

        document.addEventListener('click', () => this._close(panel));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._close(panel);
        });
    }

    _open(panel) {
        panel.classList.add('c-popover__panel--open');
        panel.setAttribute('aria-hidden', 'false');
    }

    _close(panel) {
        panel.classList.remove('c-popover__panel--open');
        panel.setAttribute('aria-hidden', 'true');
    }

    _closeAll() {
        document.querySelectorAll('.c-popover__panel--open').forEach(p => {
            p.classList.remove('c-popover__panel--open');
            p.setAttribute('aria-hidden', 'true');
        });
    }
}

customElements.define('c-popover', CPopover);
