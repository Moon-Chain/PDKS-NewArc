import{a as n,b as r,c as o,d}from"./chunk-QWFT4EHO.js";import{a as s,b as i}from"./chunk-IUADW4UU.js";var e=15;function h(a){switch(a){case"success":return'<span class="badge badge-success">Ba\u015Far\u0131l\u0131</span>';case"pending":return'<span class="badge badge-warning">Onay Bekliyor</span>';default:return'<span class="badge badge-error">Hatal\u0131</span>'}}function p(a){return new Date(a).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}var l=class extends i{constructor(){super(...arguments);this.page=1;this.total=0;this.rows=[];this.month=new Date().toISOString().slice(0,7)}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let t=await s.get(`/api/v1/attendance?page=${this.page}&limit=${e}&month=${this.month}`);this.rows=t.rows,this.total=t.total}catch(t){d(t instanceof Error?t.message:"Hareketler y\xFCklenemedi","error"),this.rows=[],this.total=0}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.total/e))}draw(){this.container.innerHTML=`
      <div class="card">
        <div class="toolbar">
          <input class="input" type="month" id="movements-month" value="${this.month}" style="max-width:160px" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} hareket</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>T\xFCr</th>
              <th>Zaman</th>
              <th>Durum</th>
              <th>IP</th>
            </tr></thead>
            <tbody>
              ${this.rows.length===0?'<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Hareket bulunamad\u0131</td></tr>':this.rows.map(t=>`
                  <tr>
                    <td>${n(t.user_name)}</td>
                    <td>${t.type==="in"?"Giri\u015F":"\xC7\u0131k\u0131\u015F"}</td>
                    <td>${p(t.timestamp)}</td>
                    <td>${h(t.status)}</td>
                    <td>${t.ip_address??"\u2014"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${r(this.page,this.totalPages,this.total,e)}
      </div>
    `,this.on("#movements-month","change",async t=>{this.month=t.target.value,this.page=1,await this.load()}),o(this.container,this.page,this.totalPages,async t=>{this.page=t,await this.load()})}};export{l as MovementsPage};
