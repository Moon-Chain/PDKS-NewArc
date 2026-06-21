import{d as m}from"./chunk-QWFT4EHO.js";import{a as c,b as f,c as d}from"./chunk-IUADW4UU.js";var w={success:"\u2713",error:"\u2717",warning:"\u26A0",info:"\u2139"},v={success:"ap-notif-item--success",error:"ap-notif-item--error",warning:"ap-notif-item--warning",info:"ap-notif-item--info"};function y(e){let n=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(n<1)return"Az \xF6nce";if(n<60)return`${n}dk \xF6nce`;let i=Math.floor(n/60);return i<24?`${i}sa \xF6nce`:`${Math.floor(i/24)}g \xF6nce`}function l(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function h(e){let[n,i,r]=e.split("-").map(Number),t=new Date(n,i-1,r),a=l(new Date),o=new Date;return o.setDate(o.getDate()-1),e===a?`Bug\xFCn \xB7 ${t.toLocaleDateString("tr-TR",{day:"numeric",month:"long"})}`:e===l(o)?`D\xFCn \xB7 ${t.toLocaleDateString("tr-TR",{day:"numeric",month:"long"})}`:Math.floor((Date.now()-t.getTime())/864e5)<7?`${t.toLocaleDateString("tr-TR",{weekday:"long"})} \xB7 ${t.toLocaleDateString("tr-TR",{day:"numeric",month:"long"})}`:t.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}function $(e){let n=new Map;for(let i of e){let r=l(new Date(i.created_at));n.has(r)||n.set(r,[]),n.get(r).push(i)}return Array.from(n.entries()).sort(([i],[r])=>r.localeCompare(i)).map(([i,r])=>({dayKey:i,label:h(i),rows:r}))}var g=class extends f{constructor(){super(...arguments);this.rows=[]}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let i=await c.get("/api/v1/notifications?limit=100");this.rows=i.rows}catch(i){m(i instanceof Error?i.message:"Bildirimler y\xFCklenemedi","error"),this.rows=[]}this.draw()}draw(){let i=this.rows.filter(t=>!t.is_read).length,r=$(this.rows);this.container.innerHTML=`
      <div class="ap-np-page">
        ${i>0?`
          <div class="ap-np-toolbar">
            <button class="ap-np-read-all-btn" id="np-read-all" type="button">${d("check","icon icon-sm")} T\xFCm\xFCn\xFC Okundu \u0130\u015Faretle</button>
          </div>`:""}
        ${r.length===0?`<div class="card ap-notif-empty">
               <div class="ap-notif-empty-icon">${d("bell","icon icon-lg")}</div>
               <p>Bildirim yok</p>
             </div>`:r.map(t=>`
              <div class="ap-np-group">
                <div class="ap-np-day-label">${t.label}</div>
                <div class="card ap-np-group-card">
                  ${t.rows.map(a=>`
                    <div class="ap-notif-item ap-np-full-item ${v[a.type]??""} ${a.is_read?"":"ap-notif-item--unread"}"
                         data-id="${a.id}" data-link="${a.link??""}">
                      <div class="ap-notif-item-dot">${w[a.type]??"\u2139"}</div>
                      <div class="ap-notif-item-body">
                        <div class="ap-np-item-row">
                          <p class="ap-notif-item-title">${a.title}</p>
                          <span class="ap-notif-item-time">${y(a.created_at)}</span>
                        </div>
                        <p class="ap-notif-item-msg">${a.message}</p>
                      </div>
                      <button class="ap-notif-del-btn" data-del="${a.id}" type="button" title="Sil">${d("x","icon icon-sm")}</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
      </div>
    `,this.on("#np-read-all","click",async()=>{await c.post("/api/v1/notifications/read-all",{}).catch(()=>{}),this.rows.forEach(t=>t.is_read=!0),this.draw()}),this.container.querySelectorAll(".ap-notif-item").forEach(t=>{t.addEventListener("click",async a=>{if(a.target.closest(".ap-notif-del-btn"))return;let o=t.dataset.id,s=t.dataset.link;if(t.classList.contains("ap-notif-item--unread")){await c.patch(`/api/v1/notifications/${o}/read`,{}).catch(()=>{});let p=this.rows.find(u=>u.id===o);p&&(p.is_read=!0),t.classList.remove("ap-notif-item--unread")}s&&window.router?.navigate(s)})}),this.container.querySelectorAll(".ap-notif-del-btn").forEach(t=>{t.addEventListener("click",async a=>{a.stopPropagation();let o=t.dataset.del;await c.delete(`/api/v1/notifications/${o}`).catch(()=>{}),this.rows=this.rows.filter(s=>s.id!==o),this.draw()})})}};export{g as NotificationsPage};
