import{a as l,d as o}from"./chunk-QWFT4EHO.js";import{a as n,b as d,c}from"./chunk-IUADW4UU.js";var g={annual:"Y\u0131ll\u0131k \u0130zin",report:"Rapor",excuse:"Mazeret \u0130zni"};function h(a,s){let e={day:"2-digit",month:"2-digit",year:"numeric"},t=new Date(a).toLocaleDateString("tr-TR",e),i=new Date(s).toLocaleDateString("tr-TR",e);return t===i?t:`${t} - ${i}`}function u(a){return new Date(a).toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"})}function v(a,s,e,t){return`
    <div class="approval-card" data-id="${a}">
      <div>
        ${l(s)}
        <div class="approval-meta">${e}</div>
        ${t?`<div class="approval-meta" style="margin-top:4px">${t}</div>`:""}
      </div>
      <div class="approval-actions">
        <button class="btn btn-primary btn-sm" data-action="approve">${c("check","icon icon-sm")} Onayla</button>
        <button class="btn btn-ghost btn-sm" data-action="reject">${c("x","icon icon-sm")} Reddet</button>
      </div>
    </div>`}var p=class extends d{constructor(){super(...arguments);this.leaves=[];this.overtimes=[]}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let[e,t]=await Promise.all([n.get("/api/v1/leaves?status=pending&limit=50"),n.get("/api/v1/overtime?status=pending&limit=50")]);this.leaves=e.rows,this.overtimes=t.rows}catch(e){o(e instanceof Error?e.message:"Onay listesi y\xFCklenemedi","error"),this.leaves=[],this.overtimes=[]}this.draw()}draw(){this.container.innerHTML=`
      <div class="card">
        <div class="card-title">\u0130zin Talepleri (${this.leaves.length})</div>
        ${this.leaves.length===0?'<p style="color:var(--text-muted)">Bekleyen izin talebi yok</p>':this.leaves.map(e=>v(e.id,e.user_name,`${h(e.start_date,e.end_date)} \xB7 ${e.days} g\xFCn \xB7 ${g[e.type]??e.type}`,e.reason?`"${e.reason}"`:"")).join("")}
      </div>
      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">Mesai Talepleri (${this.overtimes.length})</div>
        ${this.overtimes.length===0?'<p style="color:var(--text-muted)">Bekleyen mesai talebi yok</p>':this.overtimes.map(e=>v(e.id,e.user_name,`${u(e.date)} \xB7 ${e.hours} Saat`,e.description?`"${e.description}"`:"")).join("")}
      </div>
    `,this.on('[data-action="approve"]',"click",e=>{let t=e.target.closest(".approval-card");this.handleAction(t,"approve")}),this.on('[data-action="reject"]',"click",e=>{let t=e.target.closest(".approval-card");this.handleAction(t,"reject")})}async handleAction(e,t){let i=e.dataset.id,m=this.leaves.some(r=>r.id===i)?`/api/v1/leaves/${i}/${t}`:`/api/v1/overtime/${i}/${t}`;try{await n.patch(m,{}),o(t==="approve"?"Talep onayland\u0131":"Talep reddedildi","success"),await this.load()}catch(r){o(r instanceof Error?r.message:"\u0130\u015Flem ba\u015Far\u0131s\u0131z","error")}}};export{p as ApprovalsPage};
