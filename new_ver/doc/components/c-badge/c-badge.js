/* ==========================================================================
   <c-badge>
   Küçük durum/etiket rozeti. API dokümantasyonunda HTTP metodlarını
   (GET/POST/PUT/PATCH/DELETE) renkli göstermek için kullanılabilir.

   Attribute'lar:
     variant - get | post | put | patch | delete |
               primary | secondary | success | danger | warning | info | dark
               (varsayılan: secondary)

   Kullanım:
     <c-badge variant="get">GET</c-badge>
     <c-badge variant="post">POST /users</c-badge>
   ========================================================================== */

class CBadge extends HTMLElement {
    connectedCallback() {
        const variant = (this.getAttribute('variant') || 'secondary').toLowerCase();
        this.classList.add('c-badge', `c-badge--${variant}`);
    }
}

customElements.define('c-badge', CBadge);
