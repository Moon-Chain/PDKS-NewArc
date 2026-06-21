/* ==========================================================================
   <c-search-box>
   Client-side filtre arama kutusu. "target" seçicisine uyan her element,
   metni arama kutusundaki kelimeyi içermiyorsa gizlenir.

   Attribute'lar:
     target      - filtrelenecek elementlerin CSS seçicisi (örn. ".c-demo-list li")
     placeholder - input placeholder metni (varsayılan: "Ara...")
     empty-text  - hiç sonuç bulunamadığında gösterilecek metin

   Kullanım:
     <c-search-box target=".c-demo-list li" placeholder="Bileşen ara..."></c-search-box>
   ========================================================================== */

class CSearchBox extends HTMLElement {
    connectedCallback() {
        const placeholder = this.getAttribute('placeholder') || 'Ara...';
        const emptyText = this.getAttribute('empty-text') || 'Sonuç bulunamadı.';
        this.targetSelector = this.getAttribute('target') || '';

        this.innerHTML = `
            <div class="c-search-box">
                <input type="search" class="c-search-box__input" placeholder="${placeholder}">
                <div class="c-search-box__empty">${emptyText}</div>
            </div>
        `;

        this.input = this.querySelector('input');
        this.emptyMessage = this.querySelector('.c-search-box__empty');
        this.input.addEventListener('input', () => this.filter());
    }

    filter() {
        if (!this.targetSelector) {
            return;
        }

        const query = this.input.value.trim().toLowerCase();
        const items = Array.from(document.querySelectorAll(this.targetSelector));
        let visibleCount = 0;

        items.forEach(item => {
            const matches = item.textContent.trim().toLowerCase().includes(query);
            item.style.display = matches ? '' : 'none';
            if (matches) {
                visibleCount += 1;
            }
        });

        const groupSelector = this.getAttribute('group');
        if (groupSelector) {
            document.querySelectorAll(groupSelector).forEach(group => {
                const hasVisible = Array.from(group.querySelectorAll(this.targetSelector))
                    .some(item => item.style.display !== 'none');
                group.style.display = hasVisible ? '' : 'none';

                let prev = group.previousElementSibling;
                while (prev) {
                    if (/^H[1-6]$/.test(prev.tagName)) {
                        prev.style.display = hasVisible ? '' : 'none';
                        break;
                    }
                    prev = prev.previousElementSibling;
                }
            });
        }

        this.emptyMessage.classList.toggle('c-search-box__empty--visible', items.length > 0 && visibleCount === 0);
    }
}

customElements.define('c-search-box', CSearchBox);
