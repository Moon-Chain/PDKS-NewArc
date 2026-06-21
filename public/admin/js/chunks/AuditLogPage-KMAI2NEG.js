import{a as l,b as d,c,d as h}from"./chunk-QWFT4EHO.js";import{a as r,b as o,c as n}from"./chunk-IUADW4UU.js";var e=20;function u(i){return new Date(i).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}function m(i,a){return i?a?`${i} \xB7 ${a.slice(0,8)}\u2026`:i:"-"}var p=class extends o{constructor(){super(...arguments);this.page=1;this.total=0;this.rows=[];this.actor="";this.action="";this.from="";this.to=""}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let t=new URLSearchParams({page:String(this.page),limit:String(e)});this.actor&&t.set("actor",this.actor),this.action&&t.set("action",this.action),this.from&&t.set("from",this.from),this.to&&t.set("to",this.to);let s=await r.get(`/api/v1/admin/audit?${t.toString()}`);this.rows=s.rows,this.total=s.total}catch(t){h(t instanceof Error?t.message:"Aktivite ge\xE7mi\u015Fi y\xFCklenemedi","error"),this.rows=[],this.total=0}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.total/e))}draw(){this.container.innerHTML=`
      <div class="card">
        <div class="toolbar" style="flex-wrap:wrap; gap:8px">
          <input class="input" id="audit-actor" type="text" placeholder="Akt\xF6r ara..." value="${this.actor}" style="max-width:180px">
          <input class="input" id="audit-action" type="text" placeholder="Eylem (\xF6r. login)" value="${this.action}" style="max-width:160px">
          <input class="input" id="audit-from" type="date" value="${this.from}" style="max-width:160px">
          <input class="input" id="audit-to" type="date" value="${this.to}" style="max-width:160px">
          <button class="btn btn-secondary" id="audit-filter">${n("search","icon icon-sm")} Filtrele</button>
          <button class="btn btn-ghost" id="audit-clear">Temizle</button>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} kay\u0131t</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Akt\xF6r</th>
              <th>Eylem</th>
              <th>Hedef</th>
              <th>IP Adresi</th>
            </tr></thead>
            <tbody>
              ${this.rows.length===0?'<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Kay\u0131t bulunamad\u0131</td></tr>':this.rows.map(t=>`
                  <tr>
                    <td>${u(t.created_at)}</td>
                    <td>${l(t.actor_name)}</td>
                    <td>${t.action}</td>
                    <td>${m(t.target_table,t.target_id)}</td>
                    <td>${t.ip_address??"-"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${d(this.page,this.totalPages,this.total,e)}
      </div>
    `,this.on("#audit-filter","click",async()=>{this.actor=this.$("#audit-actor").value.trim(),this.action=this.$("#audit-action").value.trim(),this.from=this.$("#audit-from").value,this.to=this.$("#audit-to").value,this.page=1,await this.load()}),this.on("#audit-clear","click",async()=>{this.actor="",this.action="",this.from="",this.to="",this.page=1,await this.load()}),c(this.container,this.page,this.totalPages,async t=>{this.page=t,await this.load()})}};export{p as AuditLogPage};
