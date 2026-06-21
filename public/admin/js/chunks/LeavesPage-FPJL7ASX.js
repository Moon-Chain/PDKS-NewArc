import{a as o,b as d,c,d as p}from"./chunk-QWFT4EHO.js";import{a as n,b as l}from"./chunk-IUADW4UU.js";var s=10,h={annual:"Y\u0131ll\u0131k \u0130zin",report:"Rapor",excuse:"Mazeret \u0130zni"},u=[{value:"",label:"T\xFCm\xFC"},{value:"pending",label:"Bekleyen"},{value:"approved",label:"Onaylanan"},{value:"rejected",label:"Reddedilen"}];function v(e){switch(e){case"approved":return'<span class="badge badge-success">Onayland\u0131</span>';case"rejected":return'<span class="badge badge-error">Reddedildi</span>';default:return'<span class="badge badge-warning">Bekliyor</span>'}}function m(e,i){let t={day:"2-digit",month:"2-digit",year:"numeric"},a=new Date(e).toLocaleDateString("tr-TR",t),r=new Date(i).toLocaleDateString("tr-TR",t);return a===r?a:`${a} - ${r}`}var g=class extends l{constructor(){super(...arguments);this.page=1;this.total=0;this.rows=[];this.status=""}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let t=new URLSearchParams({page:String(this.page),limit:String(s)});this.status&&t.set("status",this.status);let a=await n.get(`/api/v1/leaves?${t.toString()}`);this.rows=a.rows,this.total=a.total}catch(t){p(t instanceof Error?t.message:"\u0130zinler y\xFCklenemedi","error"),this.rows=[],this.total=0}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.total/s))}draw(){this.container.innerHTML=`
      <div class="card">
        <div class="toolbar">
          <select class="input" id="leaves-status" style="max-width:180px">
            ${u.map(t=>`<option value="${t.value}" ${t.value===this.status?"selected":""}>${t.label}</option>`).join("")}
          </select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} talep</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tarih Aral\u0131\u011F\u0131</th>
              <th>G\xFCn</th>
              <th>T\xFCr</th>
              <th>Durum</th>
            </tr></thead>
            <tbody>
              ${this.rows.length===0?'<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">\u0130zin talebi bulunamad\u0131</td></tr>':this.rows.map(t=>`
                  <tr>
                    <td>${o(t.user_name)}</td>
                    <td>${m(t.start_date,t.end_date)}</td>
                    <td>${t.days}</td>
                    <td>${h[t.type]??t.type}</td>
                    <td>${v(t.status)}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${d(this.page,this.totalPages,this.total,s)}
      </div>
    `,this.on("#leaves-status","change",async t=>{this.status=t.target.value,this.page=1,await this.load()}),c(this.container,this.page,this.totalPages,async t=>{this.page=t,await this.load()})}};export{g as LeavesPage};
