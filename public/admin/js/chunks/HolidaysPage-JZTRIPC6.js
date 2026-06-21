import{b as y,c as g,d as i,e as u,f as b}from"./chunk-QWFT4EHO.js";import{a as l,b as p,c}from"./chunk-IUADW4UU.js";function w(r){let s=new Date().getFullYear();return[s-1,s,s+1,s+2].map(t=>`<option value="${t}" ${t===r?"selected":""}>${t}</option>`).join("")}function v(r){return new Date(r).toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",weekday:"long"})}var d=10,f=class extends p{constructor(){super(...arguments);this.year=new Date().getFullYear();this.rows=[];this.page=1}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let a=await l.get(`/api/v1/holidays?year=${this.year}`);this.rows=a.rows}catch(a){i(a instanceof Error?a.message:"Tatil g\xFCnleri y\xFCklenemedi","error"),this.rows=[]}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.rows.length/d))}get pageRows(){let a=(this.page-1)*d;return this.rows.slice(a,a+d)}draw(){let a=this.pageRows;this.container.innerHTML=`
      <div class="card">
        <div class="toolbar">
          <select class="input" id="holidays-year" style="max-width:120px">${w(this.year)}</select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.rows.length} tatil g\xFCn\xFC</span>
          <button class="btn btn-primary" id="holidays-add">${c("calendar-plus")} Tatil G\xFCn\xFC Ekle</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Ad\u0131</th>
              <th>T\xFCr</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${a.length===0?'<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Tatil g\xFCn\xFC bulunamad\u0131</td></tr>':a.map(t=>`
                  <tr>
                    <td>${v(t.date)}</td>
                    <td>${t.name}</td>
                    <td><span class="badge badge-muted">${t.is_half_day?"Yar\u0131m G\xFCn":"Tam G\xFCn"}</span></td>
                    <td><button class="btn btn-ghost btn-sm holidays-delete" data-id="${t.id}">${c("trash-2","icon icon-sm")} Sil</button></td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${y(this.page,this.totalPages,this.rows.length,d)}
      </div>
    `,this.on("#holidays-year","change",async t=>{this.year=Number(t.target.value),this.page=1,await this.load()}),this.on("#holidays-add","click",()=>this.openAddModal()),g(this.container,this.page,this.totalPages,t=>{this.page=t,this.draw()}),this.$$(".holidays-delete").forEach(t=>{t.addEventListener("click",()=>{let e=Number(t.getAttribute("data-id")),n=this.rows.find(o=>o.id===e);n&&this.deleteHoliday(n)})})}openAddModal(){let{el:a,close:t}=u("Tatil G\xFCn\xFC Ekle",`
      <form id="add-holiday-form" class="form-grid">
        <div class="form-field"><label class="label">Tarih</label><input class="input" type="date" name="date" required /></div>
        <div class="form-field"><label class="label">Ad\u0131</label><input class="input" name="name" required /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="is_half_day" />
            Yar\u0131m G\xFCn
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Ekle</button>
        </div>
      </form>
    `);a.querySelector(".modal-cancel")?.addEventListener("click",t);let e=a.querySelector("#add-holiday-form");e.addEventListener("submit",async n=>{n.preventDefault();let o=new FormData(e),m={date:String(o.get("date")),name:String(o.get("name")),is_half_day:!!e.querySelector("[name=is_half_day]")?.checked};try{await l.post("/api/v1/holidays",m),i("Tatil g\xFCn\xFC eklendi","success"),t(),this.year=parseInt(m.date.split("-")[0]),this.page=1,await this.load()}catch(h){i(h instanceof Error?h.message:"Hata","error")}})}async deleteHoliday(a){if(await b({title:"Tatil G\xFCn\xFC Sil",message:`"${a.name}" (${v(a.date)}) tatil g\xFCn\xFCn\xFC silmek istedi\u011Finize emin misiniz?`,confirmText:"Sil",danger:!0}))try{await l.delete(`/api/v1/holidays/${a.id}`),i("Tatil g\xFCn\xFC silindi","success"),await this.load()}catch(e){i(e instanceof Error?e.message:"Hata","error")}}};export{f as HolidaysPage};
