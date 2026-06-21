import{b as n,c as l,d}from"./chunk-QWFT4EHO.js";import{a as o,b as s,c as e}from"./chunk-IUADW4UU.js";var i=6,p={attendance:"Devam Raporu",leaves:"\u0130zin Raporu"};function h(r){return new Date(r).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}function v(){return new Date().toISOString().slice(0,7)}var c=class extends s{constructor(){super(...arguments);this.page=1;this.total=0;this.rows=[]}async render(){let a=v();this.container.innerHTML=`
      <div class="card">
        <div class="card-title">Devam Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay</label>
            <input class="input" type="month" id="attendance-month" value="${a}" />
          </div>
        </div>
        <button class="btn btn-primary" id="attendance-download">${e("download")} Excel Olarak \u0130ndir</button>
      </div>

      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">\u0130zin Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay (opsiyonel)</label>
            <input class="input" type="month" id="leaves-month" value="${a}" />
          </div>
        </div>
        <button class="btn btn-primary" id="leaves-download">${e("download")} Excel Olarak \u0130ndir</button>
      </div>

      <div class="card" id="reports-history-card" style="margin-top: var(--space-4)">
        <div class="card-title">Ge\xE7mi\u015F Raporlar</div>
        <p style="color:var(--text-muted)">Y\xFCkleniyor...</p>
      </div>
    `,this.on("#attendance-download","click",()=>{let t=this.$("#attendance-month").value||a;window.location.href=`/api/v1/reports/excel/attendance?month=${t}`,setTimeout(()=>this.loadHistory(),1500)}),this.on("#leaves-download","click",()=>{let t=this.$("#leaves-month").value,m=t?`/api/v1/reports/excel/leaves?month=${t}`:"/api/v1/reports/excel/leaves";window.location.href=m,setTimeout(()=>this.loadHistory(),1500)}),await this.loadHistory()}get totalPages(){return Math.max(1,Math.ceil(this.total/i))}async loadHistory(){try{let a=new URLSearchParams({page:String(this.page),limit:String(i),action:"report_download"}),t=await o.get(`/api/v1/admin/audit?${a.toString()}`);this.rows=t.rows,this.total=t.total}catch(a){d(a instanceof Error?a.message:"Ge\xE7mi\u015F raporlar y\xFCklenemedi","error"),this.rows=[],this.total=0}this.drawHistory()}drawHistory(){let a=this.$("#reports-history-card");a&&(a.innerHTML=`
      <div class="card-title">Ge\xE7mi\u015F Raporlar</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>T\xFCr</th>
            <th>D\xF6nem</th>
            <th>Olu\u015Fturulma</th>
            <th>Olu\u015Fturan</th>
          </tr></thead>
          <tbody>
            ${this.rows.length===0?'<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Hen\xFCz olu\u015Fturulmu\u015F rapor yok</td></tr>':this.rows.map(t=>`
                <tr>
                  <td>${p[t.target_table??""]??t.target_table??"-"}</td>
                  <td>${t.new_value?.month??"\u2014"}</td>
                  <td>${h(t.created_at)}</td>
                  <td>${t.actor_name}</td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      </div>
      ${n(this.page,this.totalPages,this.total,i)}
    `,l(a,this.page,this.totalPages,async t=>{this.page=t,await this.loadHistory()}))}};export{c as ReportsPage};
