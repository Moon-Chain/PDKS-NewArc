import{c as r}from"./chunk-IUADW4UU.js";function u(t,a){return`
    <div class="cell-user">
      <div class="cell-avatar">${t.split(" ").map(e=>e[0]).join("").slice(0,2).toUpperCase()}</div>
      <div class="cell-main"><strong>${t}</strong>${a?`<span>${a}</span>`:""}</div>
    </div>`}function b(t,a,n,e){let o=n===0?0:(t-1)*e+1,s=Math.min(t*e,n),c="";for(let i=1;i<=a;i++)c+=`<button type="button" class="page-btn ${i===t?"active":""}" data-page="${i}">${i}</button>`;return`
    <div class="pagination">
      <div class="pagination-pages">
        <button type="button" class="page-btn" data-page="${t-1}" ${t<=1?"disabled":""}>${r("chevron-left","icon icon-sm")}</button>
        ${c}
        <button type="button" class="page-btn" data-page="${t+1}" ${t>=a?"disabled":""}>${r("chevron-right","icon icon-sm")}</button>
      </div>
      <div class="pagination-info">${o}\u2013${s} / ${n} kay\u0131t</div>
    </div>
  `}function p(t,a,n,e){let o=t.querySelector(".pagination");o&&o.addEventListener("click",s=>{let c=s.target.closest(".page-btn[data-page]");if(!c||c.disabled)return;let i=Number(c.dataset.page);!i||i<1||i>n||i===a||e(i)})}function l(){let t=document.getElementById("admin-toast-container");return t||(t=document.createElement("div"),t.id="admin-toast-container",t.className="admin-toast-container",document.body.appendChild(t)),t}function v(t,a="success",n=3e3){let e=l(),o=document.createElement("div");o.className=`toast toast-${a}`,o.textContent=t,e.appendChild(o);let s=()=>o.remove();setTimeout(s,n),o.addEventListener("click",s)}function d(t,a){let n=document.createElement("div");n.className="modal-overlay open",n.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h3>${t}</h3>
        <button class="btn btn-ghost btn-sm modal-close" type="button">${r("x","icon icon-sm")}</button>
      </div>
      <div class="modal-content">${a}</div>
    </div>
  `,document.body.appendChild(n);let e=()=>n.remove();return n.querySelector(".modal-close")?.addEventListener("click",e),n.addEventListener("click",o=>{o.target===n&&e()}),{el:n,close:e}}function g(t){return new Promise(a=>{let n=t.danger?"btn btn-danger":"btn btn-primary",{el:e,close:o}=d(t.title,`
      <p style="color:var(--text-secondary); margin-bottom: var(--space-2)">${t.message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost modal-cancel" type="button">${t.cancelText??"\u0130ptal"}</button>
        <button class="${n} modal-confirm" type="button">${t.confirmText??"Onayla"}</button>
      </div>
    `);e.querySelector(".modal-cancel")?.addEventListener("click",()=>{o(),a(!1)}),e.querySelector(".modal-confirm")?.addEventListener("click",()=>{o(),a(!0)})})}export{u as a,b,p as c,v as d,d as e,g as f};
