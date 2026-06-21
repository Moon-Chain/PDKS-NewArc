/* ==========================================================================
   <c-accordion> / <c-accordion-item>
   Açılır/kapanır panel listesi (SSS, endpoint detayları vb.).
   "open" attribute'u verilen <c-accordion-item> başlangıçta açık gösterilir.

   Kullanım:
     <c-accordion>
       <c-accordion-item title="Soru 1" open>Cevap 1...</c-accordion-item>
       <c-accordion-item title="Soru 2">Cevap 2...</c-accordion-item>
     </c-accordion>
   ========================================================================== */

class CAccordion extends HTMLElement {
    connectedCallback() {
        const items = Array.from(this.children).filter(c => c.tagName.toLowerCase() === 'c-accordion-item');

        items.forEach((item, index) => {
            const title = item.getAttribute('title') || `Başlık ${index + 1}`;
            const isOpen = item.hasAttribute('open');

            const wrapper = document.createElement('div');
            wrapper.className = 'c-accordion__item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'c-accordion__trigger' + (isOpen ? ' c-accordion__trigger--open' : '');
            button.textContent = title;

            const panel = document.createElement('div');
            panel.className = 'c-accordion__panel' + (isOpen ? ' c-accordion__panel--open' : '');
            panel.append(...Array.from(item.childNodes));

            button.addEventListener('click', () => {
                button.classList.toggle('c-accordion__trigger--open');
                panel.classList.toggle('c-accordion__panel--open');
            });

            wrapper.appendChild(button);
            wrapper.appendChild(panel);
            item.replaceWith(wrapper);
        });
    }
}

customElements.define('c-accordion', CAccordion);

/* <c-accordion-item> sadece <c-accordion> tarafından okunan bir veri
   taşıyıcısıdır, işlenmeden önce CSS ile gizlenir (bkz. c-accordion.css). */
class CAccordionItem extends HTMLElement { }

customElements.define('c-accordion-item', CAccordionItem);
