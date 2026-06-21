import{a as v}from"./chunk-FKJNCFTW.js";import{a as f,b as g,c as y,d as n,e as p,f as _}from"./chunk-QWFT4EHO.js";import{a as o,b as h,c as d}from"./chunk-IUADW4UU.js";var w={admin:"Y\xF6netici",mudur:"M\xFCd\xFCr",takim_lideri:"Tak\u0131m Lideri",personel:"Personel"},u=10;function k(b){return Object.entries(w).map(([c,e])=>`<option value="${c}" ${c===b?"selected":""}>${e}</option>`).join("")}var $=class extends h{constructor(){super(...arguments);this.page=1;this.total=0;this.users=[];this.search="";this.isManager=!1}async render(){let e=v.get("user");this.isManager=e?.role==="admin"||e?.role==="mudur",this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>',await this.load()}async load(){try{let e=await o.get(`/api/v1/users?page=${this.page}&perPage=${u}`);this.users=e.users,this.total=e.total}catch(e){n(e instanceof Error?e.message:"Personel listesi y\xFCklenemedi","error"),this.users=[],this.total=0}this.draw()}get totalPages(){return Math.max(1,Math.ceil(this.total/u))}get filteredUsers(){let e=this.search.trim().toLowerCase();return e?this.users.filter(a=>a.name.toLowerCase().includes(e)||a.personnel_id.toLowerCase().includes(e)||(a.title??"").toLowerCase().includes(e)):this.users}draw(){let e=this.filteredUsers;this.container.innerHTML=`
      <div class="card">
        <div class="toolbar">
          <input class="input" id="users-search" placeholder="Ad, ID veya unvan ara..." value="${this.search}" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} personel</span>
          ${this.isManager?`<button class="btn btn-primary" id="users-add">${d("user-plus","icon icon-sm")} Yeni Personel</button>`:""}
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>\xDCnvan</th>
              <th>Rol</th>
              <th>\u0130zin Bakiyesi</th>
              <th>Durum</th>
              ${this.isManager?"<th></th>":""}
            </tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="${this.isManager?6:5}" style="text-align:center; color:var(--text-muted)">Personel bulunamad\u0131</td></tr>`:e.map(a=>`
                  <tr>
                    <td>${f(a.name,a.personnel_id)}</td>
                    <td>${a.title??"\u2014"}</td>
                    <td><span class="badge ${a.role==="admin"?"badge-primary":"badge-muted"}">${w[a.role]??a.role}</span></td>
                    <td>${a.leave_balance} g\xFCn</td>
                    <td>${a.is_deleted?'<span class="badge badge-muted">Pasif</span>':'<span class="badge badge-success">Aktif</span>'}</td>
                    ${this.isManager?`
                      <td>
                        <div style="display:flex; gap:6px; justify-content:flex-end">
                          <button class="btn btn-ghost btn-sm users-edit" data-id="${a.id}" title="D\xFCzenle">${d("settings","icon icon-sm")}</button>
                          <button class="btn btn-ghost btn-sm users-delete" data-id="${a.id}" title="Pasife Al">${d("x","icon icon-sm")}</button>
                        </div>
                      </td>`:""}
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${g(this.page,this.totalPages,this.total,u)}
      </div>
    `,this.attachHandlers()}attachHandlers(){this.on("#users-search","input",e=>{this.search=e.target.value,this.draw()}),y(this.container,this.page,this.totalPages,async e=>{this.page=e,await this.load()}),this.on("#users-add","click",()=>this.openAddModal()),this.$$(".users-edit").forEach(e=>{e.addEventListener("click",()=>{let a=e.getAttribute("data-id"),t=this.users.find(i=>i.id===a);t&&this.openEditModal(t)})}),this.$$(".users-delete").forEach(e=>{e.addEventListener("click",()=>{let a=e.getAttribute("data-id"),t=this.users.find(i=>i.id===a);t&&this.deleteUser(t)})})}openAddModal(){let{el:e,close:a}=p("Yeni Personel Ekle",`
      <form id="add-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required /></div>
        <div class="form-field"><label class="label">\xDCnvan / Pozisyon</label><input class="input" name="title" /></div>
        <div class="form-field"><label class="label">Personel ID</label><input class="input" name="personnel_id" required /></div>
        <div class="form-field"><label class="label">\u015Eifre</label><input class="input" type="password" name="password" autocomplete="new-password" required /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${k("personel")}</select></div>
        <div class="form-field"><label class="label">Y\u0131ll\u0131k \u0130zin Bakiyesi (G\xFCn)</label><input class="input" type="number" min="0" name="leave_balance" value="14" /></div>
        <div class="form-field"><label class="label">\u0130\u015Fe Giri\u015F Tarihi</label><input class="input" type="date" name="start_date" /></div>
        <div class="form-field"><label class="label">Do\u011Fum Tarihi</label><input class="input" type="date" name="birth_date" /></div>
        <div class="form-field"><label class="label">Cihaz K\u0131s\u0131tlamas\u0131 (UA \u0130\xE7eri\u011Fi)</label><input class="input" name="allowed_device" placeholder="\xD6rn: iPhone, Samsung" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" />
            Nakliye / Uzaktan Giri\u015F Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Personel Ekle</button>
        </div>
      </form>
    `);e.querySelector(".modal-cancel")?.addEventListener("click",a);let t=e.querySelector("#add-user-form");t.addEventListener("submit",async i=>{i.preventDefault();let m=new FormData(t),l={};m.forEach((s,r)=>{s!==""&&(l[r]=s)}),l.can_remote_check_in=!!t.querySelector("[name=can_remote_check_in]")?.checked,l.leave_balance&&(l.leave_balance=Number(l.leave_balance));try{await o.post("/api/v1/users",l),n("Personel eklendi","success"),a(),this.page=1,await this.load()}catch(s){n(s instanceof Error?s.message:"Hata","error")}})}openEditModal(e){let{el:a,close:t}=p(`Personel D\xFCzenle \u2014 ${e.name}`,`
      <form id="edit-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required value="${e.name}" /></div>
        <div class="form-field"><label class="label">\xDCnvan / Pozisyon</label><input class="input" name="title" value="${e.title??""}" /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${k(e.role)}</select></div>
        <div class="form-field"><label class="label">Y\u0131ll\u0131k \u0130zin Bakiyesi (G\xFCn)</label><input class="input" type="number" min="0" name="leave_balance" value="${e.leave_balance}" /></div>
        <div class="form-field"><label class="label">\u0130\u015Fe Giri\u015F Tarihi</label><input class="input" type="date" name="start_date" value="${e.start_date?.slice(0,10)??""}" /></div>
        <div class="form-field"><label class="label">Do\u011Fum Tarihi</label><input class="input" type="date" name="birth_date" value="${e.birth_date?.slice(0,10)??""}" /></div>
        <div class="form-field"><label class="label">Cihaz K\u0131s\u0131tlamas\u0131 (UA \u0130\xE7eri\u011Fi)</label><input class="input" name="allowed_device" value="${e.allowed_device??""}" /></div>
        <div class="form-field"><label class="label">Yeni \u015Eifre (opsiyonel)</label><input class="input" type="password" name="password" autocomplete="new-password" placeholder="De\u011Fi\u015Ftirmek istemiyorsan\u0131z bo\u015F b\u0131rak\u0131n" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" ${e.can_remote_check_in?"checked":""} />
            Nakliye / Uzaktan Giri\u015F Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Kaydet</button>
        </div>
      </form>
    `);a.querySelector(".modal-cancel")?.addEventListener("click",t);let i=a.querySelector("#edit-user-form");i.addEventListener("submit",async m=>{m.preventDefault();let l=new FormData(i),s={};l.forEach((r,P)=>{s[P]=r===""?null:r}),s.can_remote_check_in=!!i.querySelector("[name=can_remote_check_in]")?.checked,s.leave_balance&&(s.leave_balance=Number(s.leave_balance)),s.password||delete s.password;try{await o.patch(`/api/v1/users/${e.id}`,s),n("Personel g\xFCncellendi","success"),t(),await this.load()}catch(r){n(r instanceof Error?r.message:"Hata","error")}})}async deleteUser(e){if(await _({title:"Personeli Pasife Al",message:`"${e.name}" personeli pasife al\u0131nacak. Giri\u015F yapamaz hale gelir.`,confirmText:"Pasife Al",cancelText:"Vazge\xE7",danger:!0}))try{await o.delete(`/api/v1/users/${e.id}`),n("Personel pasife al\u0131nd\u0131","success"),await this.load()}catch(t){n(t instanceof Error?t.message:"Hata","error")}}};export{$ as UsersPage};
