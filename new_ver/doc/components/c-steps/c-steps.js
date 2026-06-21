/* ==========================================================================
   <c-steps> / <c-step>
   Numaralı adım rehberi. "3 adımda kurulum" tipi sıralı içerikler için.

   Kullanım:
     <c-steps>
       <c-step title="Repoyu Klonla">
         <p><code>git clone https://example.com/repo.git</code></p>
       </c-step>
       <c-step title="Bağımlılıkları Yükle">
         <p><code>npm install</code></p>
       </c-step>
       <c-step title="Başlat">
         <p><code>npm start</code></p>
       </c-step>
     </c-steps>
   ========================================================================== */

class CSteps extends HTMLElement {
    connectedCallback() {
        const steps = Array.from(this.querySelectorAll('c-step'));
        this.classList.add('c-steps');

        const items = steps.map((step, i) => {
            const title = step.getAttribute('title') || '';
            const nodes = Array.from(step.childNodes);

            const wrapper = document.createElement('div');
            wrapper.className = 'c-steps__item';

            const num = document.createElement('div');
            num.className = 'c-steps__number';
            num.textContent = i + 1;

            const content = document.createElement('div');
            content.className = 'c-steps__content';

            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'c-steps__title';
                titleEl.textContent = title;
                content.appendChild(titleEl);
            }

            const body = document.createElement('div');
            body.className = 'c-steps__body';
            body.append(...nodes);
            content.appendChild(body);

            wrapper.appendChild(num);
            wrapper.appendChild(content);
            return wrapper;
        });

        this.innerHTML = '';
        items.forEach(el => this.appendChild(el));
    }
}

customElements.define('c-steps', CSteps);

class CStep extends HTMLElement {}
customElements.define('c-step', CStep);
