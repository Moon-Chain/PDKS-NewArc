/* ==========================================================================
   <c-toc>
   Sayfa içeriğindeki başlıkları (h2, h3) tarayıp sağda sticky bir
   "İçindekiler" menüsü oluşturur ve scroll-spy ile aktif başlığı vurgular.

   Attribute'lar:
     target - başlıkların aranacağı container seçici (varsayılan: ".page-inner")

   Not: Bu component sayfa yüklendiğinde DOM'da hazır olan başlıkları okur,
   bu yüzden <c-toc> etiketi sayfanın sonunda (içerikten sonra) kullanılmalıdır.

   Kullanım:
     <c-toc target=".page-inner"></c-toc>
   ========================================================================== */

class CToc extends HTMLElement {
    connectedCallback() {
        const targetSelector = this.getAttribute('target') || '.page-inner';
        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        const headings = Array.from(target.querySelectorAll('h2, h3'));
        if (headings.length === 0) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'c-toc';

        const title = document.createElement('div');
        title.className = 'c-toc__title';
        title.textContent = 'İçindekiler';
        wrapper.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'c-toc__list';

        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `toc-${index}-${heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            }

            const item = document.createElement('li');
            item.className = 'c-toc__item' + (heading.tagName === 'H3' ? ' c-toc__item--sub' : '');

            const link = document.createElement('a');
            link.className = 'c-toc__link';
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;

            item.appendChild(link);
            list.appendChild(item);
        });

        wrapper.appendChild(list);

        this.innerHTML = '';
        this.appendChild(wrapper);

        this.setupScrollSpy(headings, list);
    }

    setupScrollSpy(headings, list) {
        const links = Array.from(list.querySelectorAll('.c-toc__link'));

        const onScroll = () => {
            let activeIndex = 0;
            headings.forEach((heading, index) => {
                if (heading.getBoundingClientRect().top <= 100) {
                    activeIndex = index;
                }
            });

            links.forEach((link, index) => {
                link.classList.toggle('c-toc__link--active', index === activeIndex);
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
}

customElements.define('c-toc', CToc);
