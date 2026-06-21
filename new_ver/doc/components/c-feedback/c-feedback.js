/* ==========================================================================
   <c-feedback>
   "Bu sayfa yardımcı oldu mu?" widget'ı.
   Yanıt localStorage'a kaydedilir; sayfa yenilense de durum korunur.

   Attribute'lar:
     question - soru metni (varsayılan: "Bu sayfa yardımcı oldu mu?")
     page-id  - localStorage anahtar son eki (varsayılan: location.pathname)

   Kullanım:
     <c-feedback></c-feedback>
     <c-feedback question="Bu bölüm yeterince açık mıydı?"></c-feedback>
   ========================================================================== */

class CFeedback extends HTMLElement {
    connectedCallback() {
        const question = this.getAttribute('question') || 'Bu sayfa yardımcı oldu mu?';
        const pageId   = this.getAttribute('page-id')  || location.pathname;
        const key      = `c-feedback:${pageId}`;
        const saved    = localStorage.getItem(key);

        this.classList.add('c-feedback');

        if (saved) {
            this._renderThanks(saved === 'yes');
            return;
        }

        const questionEl = document.createElement('span');
        questionEl.className   = 'c-feedback__question';
        questionEl.textContent = question;

        const buttons = document.createElement('div');
        buttons.className = 'c-feedback__buttons';

        [{ value: 'yes', label: 'Evet' }, { value: 'no', label: 'Hayır' }].forEach(({ value, label }) => {
            const btn = document.createElement('button');
            btn.type        = 'button';
            btn.className   = `c-feedback__btn c-feedback__btn--${value}`;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                localStorage.setItem(key, value);
                this._renderThanks(value === 'yes');
            });
            buttons.appendChild(btn);
        });

        this.appendChild(questionEl);
        this.appendChild(buttons);
    }

    _renderThanks(positive) {
        this.innerHTML = '';
        const msg = document.createElement('span');
        msg.className = 'c-feedback__thanks' + (positive ? '' : ' c-feedback__thanks--negative');
        msg.textContent = positive
            ? 'Teşekkürler! Faydalı olduğuna sevindik.'
            : 'Teşekkürler. Bu sayfayı geliştirmeye çalışacağız.';
        this.appendChild(msg);
    }
}

customElements.define('c-feedback', CFeedback);
