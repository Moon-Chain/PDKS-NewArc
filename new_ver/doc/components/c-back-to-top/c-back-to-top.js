/* ==========================================================================
   <c-back-to-top>
   300px aşağı kaydırıldığında beliren "başa dön" butonu.
   Tıklanınca smooth scroll ile sayfanın başına döner.

   Attribute'lar:
     threshold - kaç px sonra görüneceği (varsayılan: 300)

   Kullanım: <c-back-to-top></c-back-to-top>
   ========================================================================== */

class CBackToTop extends HTMLElement {
    connectedCallback() {
        const threshold = Number(this.getAttribute('threshold') || 300);

        this.classList.add('c-back-to-top');
        this.innerHTML = `<button class="c-back-to-top__btn" aria-label="Başa dön" title="Başa dön">↑</button>`;

        const btn = this.querySelector('.c-back-to-top__btn');

        const update = () => {
            this.classList.toggle('c-back-to-top--visible', window.scrollY > threshold);
        };

        window.addEventListener('scroll', update, { passive: true });
        update();

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

customElements.define('c-back-to-top', CBackToTop);
