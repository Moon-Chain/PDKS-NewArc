/* ==========================================================================
   <c-read-progress>
   Sayfa tepesinde scroll bazlı ince okuma ilerleme çubuğu.

   Attribute'lar: yok

   Kullanım: <c-read-progress></c-read-progress>
   ========================================================================== */

class CReadProgress extends HTMLElement {
    connectedCallback() {
        this.classList.add('c-read-progress');
        this.innerHTML = `<div class="c-read-progress__bar"></div>`;

        const bar = this.querySelector('.c-read-progress__bar');

        const update = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
            bar.style.width = Math.min(100, progress) + '%';
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
    }
}

customElements.define('c-read-progress', CReadProgress);
