/* ==========================================================================
   <c-timeline>
   Dikey zaman çizelgesi. Changelog, proje geçmişi, kurulum adımları için.

   Kullanım:
     <c-timeline>
       <c-timeline-item date="2025-06" title="v1.1.0 — Yeni Bileşenler">
         <p>11 yeni bileşen eklendi.</p>
       </c-timeline-item>
       <c-timeline-item date="2025-01" title="v1.0.0 — İlk Sürüm">
         <p>İlk kararlı sürüm yayınlandı.</p>
       </c-timeline-item>
     </c-timeline>
   ========================================================================== */

class CTimeline extends HTMLElement {
    connectedCallback() {
        const items = Array.from(this.querySelectorAll('c-timeline-item'));

        this.classList.add('c-timeline');

        const html = items.map(item => {
            const date  = item.getAttribute('date')  || '';
            const title = item.getAttribute('title') || '';
            const nodes = Array.from(item.childNodes);

            const wrapper = document.createElement('div');
            wrapper.className = 'c-timeline__item';

            const marker = document.createElement('div');
            marker.className = 'c-timeline__marker';

            const content = document.createElement('div');
            content.className = 'c-timeline__content';

            if (date) {
                const dateEl = document.createElement('div');
                dateEl.className   = 'c-timeline__date';
                dateEl.textContent = date;
                content.appendChild(dateEl);
            }

            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className   = 'c-timeline__title';
                titleEl.textContent = title;
                content.appendChild(titleEl);
            }

            const body = document.createElement('div');
            body.className = 'c-timeline__body';
            body.append(...nodes);
            content.appendChild(body);

            wrapper.appendChild(marker);
            wrapper.appendChild(content);
            return wrapper;
        });

        this.innerHTML = '';
        html.forEach(el => this.appendChild(el));
    }
}

customElements.define('c-timeline', CTimeline);

class CTimelineItem extends HTMLElement {}
customElements.define('c-timeline-item', CTimelineItem);
