import{a as n,b as l,c as o,d}from"./chunk-QWFT4EHO.js";import{a as i,b as r}from"./chunk-IUADW4UU.js";var e=10,h=[{value:"",label:"T\xFCm\xFC"},{value:"pending",label:"Bekleyen"},{value:"approved",label:"Onaylanan"},{value:"rejected",label:"Reddedilen"}];function p(a){switch(a){case"approved":return'<span class="badge badge-success">Onayland\u0131</span>';case"rejected":return'<span class="badge badge-error">Reddedildi</span>';default:return'<span class="badge badge-warning">Bekliyor</span>'}}function u(a){return new Date(a).toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"})}var c=class extends r{constructor(){super(...arguments);this.page=1;this.total=0;this.rows=[];this.status=""}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let t=new URLSearchParams({page:String(this.page),limit:String(e)});this.status&&t.set("status",this.status);let s=await i.get(`/api/v1/overtime?${t.toString()}`);this.rows=s.rows,this.total=s.total}catch(t){d(t instanceof Error?t.message:"Mesai talepleri y\xFCklenemedi","error"),this.rows=[],this.total=0}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.total/e))}draw(){this.container.innerHTML=`
      <div class="card">
        <div class="toolbar">
          <select class="input" id="overtime-status" style="max-width:180px">
            ${h.map(t=>`<option value="${t.value}" ${t.value===this.status?"selected":""}>${t.label}</option>`).join("")}
          </select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} talep</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tarih</th>
              <th>S\xFCre</th>
              <th>A\xE7\u0131klama</th>
              <th>Durum</th>
            </tr></thead>
            <tbody>
              ${this.rows.length===0?'<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Mesai talebi bulunamad\u0131</td></tr>':this.rows.map(t=>`
                  <tr>
                    <td>${n(t.user_name)}</td>
                    <td>${u(t.date)}</td>
                    <td>${t.hours} Saat</td>
                    <td>${t.description??"\u2014"}</td>
                    <td>${p(t.status)}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${l(this.page,this.totalPages,this.total,e)}
      </div>
    `,this.on("#overtime-status","change",async t=>{this.status=t.target.value,this.page=1,await this.load()}),o(this.container,this.page,this.totalPages,async t=>{this.page=t,await this.load()})}};export{c as OvertimePage};
