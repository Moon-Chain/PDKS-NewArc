/* ==========================================================================
   <c-toast>
   Geçici bildirim mesajları. Sağ alt köşede yığılır, otomatik kapanır.

   Statik kullanım (JS):
     CToast.show('Kaydedildi!', { variant: 'success' });
     CToast.show('Hata oluştu.', { variant: 'danger', duration: 5000 });
     CToast.show('Kalıcı bildirim', { variant: 'info', duration: 0 });

   Element kullanımı (HTML + JS):
     <c-toast id="t" variant="success" message="Kaydedildi!"></c-toast>
     document.getElementById('t').show();

   Attribute'lar (element formu):
     variant  - info | success | warning | danger (varsayılan: info)
     message  - gösterilecek metin
     duration - ms cinsinden süre; 0 = kalıcı (varsayılan: 3500)
   ========================================================================== */

class CToast extends HTMLElement {
    show() {
        const variant  = this.getAttribute('variant')  || 'info';
        const message  = this.getAttribute('message')  || this.textContent.trim();
        const duration = parseInt(this.getAttribute('duration') ?? '3500', 10);
        CToast.show(message, { variant, duration });
    }

    static show(message, { variant = 'info', duration = 3500 } = {}) {
        let container = document.querySelector('.c-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'c-toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(container);
        }

        const icons = { success: '✓', danger: '✕', warning: '⚠', info: 'ℹ' };

        const toast = document.createElement('div');
        toast.className = `c-toast c-toast--${variant}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `
            <span class="c-toast__icon" aria-hidden="true">${icons[variant] ?? icons.info}</span>
            <span class="c-toast__message">${message}</span>
            <button class="c-toast__close" aria-label="Kapat">&times;</button>
        `;

        const dismiss = () => {
            toast.classList.add('c-toast--out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };

        toast.querySelector('.c-toast__close').addEventListener('click', dismiss);
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('c-toast--in'));

        if (duration > 0) setTimeout(dismiss, duration);
    }
}

customElements.define('c-toast', CToast);
