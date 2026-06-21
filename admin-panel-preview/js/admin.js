// ============================================================
// PDKS Admin Paneli — Statik Önizleme / İskelet
// Gerçek uygulamada bu dosya public/ts/admin/moduleRegistry.ts +
// app-admin.ts + Router.ts + BasePage alt sınıflarına karşılık gelir.
// Burada tek dosyada, build adımı olmadan önizleme amaçlı yazıldı.
// İkonlar: Lucide (https://lucide.dev — MIT, ücretsiz), CDN üzerinden.
// ============================================================

// ---- Modül Kayıt Sistemi (bkz. ADMIN-PANEL.md, Bölüm 2) ----
// `locked: true` olan modüller ileriki kademelerde (1, 2, 3) eklenecek.
// `permission` alanı gerçek uygulamada requirePermission() ile eşleşir;
// V1'de "tam yetkili admin" hesabı için hepsi true döner.
const ADMIN_MODULES = [
  { group: 'Operasyon', items: [
    { id: 'dashboard',  label: 'Genel Bakış',     icon: 'layout-dashboard', permission: 'dashboard:view' },
    { id: 'movements',  label: 'Hareketler',      icon: 'clock',            permission: 'attendance:view' },
    { id: 'approvals',  label: 'Onaylar',         icon: 'check-check',      permission: 'leave:approve', badge: 3 },
  ]},
  { group: 'İnsan Kaynakları', items: [
    { id: 'users',      label: 'Personel',        icon: 'users',            permission: 'user:manage' },
    { id: 'leaves',     label: 'İzinler',         icon: 'calendar-days',    permission: 'leave:view' },
    { id: 'overtime',   label: 'Mesai',           icon: 'zap',              permission: 'overtime:view' },
    { id: 'reports',    label: 'Raporlar',        icon: 'file-spreadsheet', permission: 'reports:view' },
  ]},
  { group: 'Ayarlar', items: [
    { id: 'holidays',   label: 'Tatil Günleri',   icon: 'sun',              permission: 'settings:view' },
    { id: 'settings',   label: 'Şirket Ayarları', icon: 'settings',         permission: 'settings:manage' },
  ]},
  { group: 'Sistem', items: [
    { id: 'audit',      label: 'Aktivite Geçmişi',icon: 'history',          permission: 'audit:view' },
    { id: 'branches',   label: 'Şubeler',         icon: 'map-pin',          permission: 'branch:manage',  locked: true, lockNote: 'Kademe 1' },
    { id: 'roles',      label: 'Rol & Yetki',     icon: 'shield',           permission: 'role:manage',    locked: true, lockNote: 'Kademe 2' },
    { id: 'billing',    label: 'Plan & Faturalama', icon: 'credit-card',    permission: 'billing:manage', locked: true, lockNote: 'Kademe 3' },
  ]},
];

// Sayfa başlıkları / alt yazılar
const PAGE_META = {
  dashboard: { title: 'Genel Bakış',     sub: 'Şirketinizin günlük özeti' },
  movements: { title: 'Hareketler',      sub: 'Tüm personelin giriş/çıkış kayıtları' },
  approvals: { title: 'Onaylar',         sub: 'Bekleyen izin ve mesai talepleri' },
  users:     { title: 'Personel',        sub: 'Personel listesi ve yönetimi' },
  leaves:    { title: 'İzinler',         sub: 'İzin talepleri ve bakiyeler' },
  overtime:  { title: 'Mesai',           sub: 'Mesai talepleri ve kayıtları' },
  reports:   { title: 'Raporlar',        sub: 'Excel raporu indir' },
  holidays:  { title: 'Tatil Günleri',   sub: 'Resmi ve şirket tatilleri' },
  settings:  { title: 'Şirket Ayarları', sub: 'Ofis IP, vardiya, mola kuralları' },
  audit:     { title: 'Aktivite Geçmişi',sub: 'Kim ne zaman ne yaptı' },
  branches:  { title: 'Şubeler',         sub: 'Şube yönetimi' },
  roles:     { title: 'Rol & Yetki',     sub: 'Özel roller ve izin atamaları' },
  billing:   { title: 'Plan & Faturalama', sub: 'Abonelik ve fatura yönetimi' },
  notifications: { title: 'Bildirimler', sub: 'Sistem bildirimleri ve uyarılar' },
};

// ============================================================
// Mock Veri — "Acme Yazılım A.Ş." (24 personel)
// ============================================================
const DEPARTMENTS = ['Muhasebe', 'Satış', 'IT', 'Üretim', 'İnsan Kaynakları', 'Pazarlama', 'Lojistik'];

const USERS = [
  { name: 'Berkay Ölçer',   dept: 'IT',               role: 'admin',        balance: 14, status: 'active' },
  { name: 'Ahmet Yılmaz',   dept: 'Muhasebe',         role: 'mudur',        balance: 12, status: 'active' },
  { name: 'Fatma Şahin',    dept: 'Satış',            role: 'mudur',        balance: 14, status: 'active' },
  { name: 'Mustafa Aydın',  dept: 'Üretim',           role: 'mudur',        balance: 10, status: 'active' },
  { name: 'Ayşe Demir',     dept: 'IT',               role: 'takim_lideri', balance: 11, status: 'active' },
  { name: 'Hakan Çelik',    dept: 'Satış',            role: 'takim_lideri', balance: 8,  status: 'active' },
  { name: 'Elif Arslan',    dept: 'İnsan Kaynakları', role: 'takim_lideri', balance: 14, status: 'active' },
  { name: 'Murat Doğan',    dept: 'Lojistik',         role: 'takim_lideri', balance: 9,  status: 'active' },
  { name: 'Mehmet Kaya',    dept: 'Satış',            role: 'personel',     balance: 9,  status: 'active' },
  { name: 'Can Öztürk',     dept: 'Üretim',           role: 'personel',     balance: 14, status: 'active' },
  { name: 'Selin Acar',     dept: 'İnsan Kaynakları', role: 'personel',     balance: 6,  status: 'leave' },
  { name: 'Zeynep Kaya',    dept: 'Muhasebe',         role: 'personel',     balance: 5,  status: 'leave' },
  { name: 'Burak Yıldız',   dept: 'IT',               role: 'personel',     balance: 14, status: 'active' },
  { name: 'Deniz Korkmaz',  dept: 'Pazarlama',        role: 'personel',     balance: 13, status: 'active' },
  { name: 'Gizem Polat',    dept: 'Pazarlama',        role: 'personel',     balance: 10, status: 'active' },
  { name: 'Emre Şentürk',   dept: 'Lojistik',         role: 'personel',     balance: 14, status: 'active' },
  { name: 'Büşra Aksoy',    dept: 'Muhasebe',         role: 'personel',     balance: 7,  status: 'active' },
  { name: 'Tolga Güneş',    dept: 'Üretim',           role: 'personel',     balance: 12, status: 'active' },
  { name: 'Pınar Yalçın',   dept: 'Satış',            role: 'personel',     balance: 14, status: 'active' },
  { name: 'Onur Kara',      dept: 'IT',               role: 'personel',     balance: 14, status: 'active' },
  { name: 'Merve Tekin',    dept: 'İnsan Kaynakları', role: 'personel',     balance: 11, status: 'active' },
  { name: 'Serkan Avcı',    dept: 'Lojistik',         role: 'personel',     balance: 14, status: 'active' },
  { name: 'Nazlı Çakır',    dept: 'Pazarlama',        role: 'personel',     balance: 9,  status: 'active' },
  { name: 'Eski Çalışan',   dept: 'Satış',            role: 'personel',     balance: 0,  status: 'inactive' },
];

// Bugünkü hareketler (giriş/çıkış) — 18 kişi içeride
const MOVEMENTS = [
  { name: 'Berkay Ölçer',  type: 'Giriş', time: '08:32', status: 'success', ip: '192.168.1.10' },
  { name: 'Ahmet Yılmaz',  type: 'Giriş', time: '08:41', status: 'success', ip: '192.168.1.10' },
  { name: 'Fatma Şahin',   type: 'Giriş', time: '08:45', status: 'success', ip: '192.168.1.10' },
  { name: 'Mehmet Kaya',   type: 'Giriş', time: '08:47', status: 'success', ip: '192.168.1.10' },
  { name: 'Ayşe Demir',    type: 'Giriş', time: '08:51', status: 'success', ip: '192.168.1.10' },
  { name: 'Can Öztürk',    type: 'Çıkış', time: '07:55', status: 'error',   ip: '88.231.4.2' },
  { name: 'Selin Acar',    type: 'Giriş', time: '09:02', status: 'success', ip: '192.168.1.10' },
  { name: 'Burak Yıldız',  type: 'Giriş', time: '09:05', status: 'success', ip: '192.168.1.10' },
  { name: 'Deniz Korkmaz', type: 'Giriş', time: '09:08', status: 'success', ip: '192.168.1.10' },
  { name: 'Hakan Çelik',   type: 'Giriş', time: '09:12', status: 'success', ip: '192.168.1.10' },
  { name: 'Emre Şentürk',  type: 'Giriş', time: '09:15', status: 'success', ip: '192.168.1.10' },
  { name: 'Büşra Aksoy',   type: 'Giriş', time: '09:20', status: 'success', ip: '192.168.1.10' },
  { name: 'Tolga Güneş',   type: 'Giriş', time: '09:24', status: 'success', ip: '192.168.1.10' },
  { name: 'Pınar Yalçın',  type: 'Giriş', time: '09:28', status: 'success', ip: '192.168.1.10' },
  { name: 'Onur Kara',     type: 'Giriş', time: '09:33', status: 'success', ip: '192.168.1.10' },
  { name: 'Merve Tekin',   type: 'Giriş', time: '09:37', status: 'success', ip: '192.168.1.10' },
  { name: 'Serkan Avcı',   type: 'Giriş', time: '09:40', status: 'success', ip: '192.168.1.10' },
  { name: 'Nazlı Çakır',   type: 'Giriş', time: '09:44', status: 'success', ip: '192.168.1.10' },
  { name: 'Ahmet Yılmaz',  type: 'Çıkış', time: '18:14', status: 'success', ip: '192.168.1.10' },
  { name: 'Mustafa Aydın', type: 'Giriş', time: '08:38', status: 'success', ip: '192.168.1.10' },
];

const LEAVES = [
  { name: 'Selin Acar',   range: '10-16 Haz 2026',    days: 6, type: 'Yıllık',  status: 'pending'  },
  { name: 'Zeynep Kaya',  range: '20 Haz 2026',       days: 1, type: 'Rapor',   status: 'pending'  },
  { name: 'Ahmet Yılmaz', range: '01-05 Haz 2026',    days: 5, type: 'Yıllık',  status: 'approved' },
  { name: 'Can Öztürk',   range: '28 May 2026',       days: 1, type: 'Mazeret', status: 'rejected' },
  { name: 'Pınar Yalçın', range: '02-03 Tem 2026',    days: 2, type: 'Yıllık',  status: 'approved' },
  { name: 'Onur Kara',    range: '15 Haz 2026',       days: 1, type: 'Mazeret', status: 'approved' },
  { name: 'Büşra Aksoy',  range: '22-26 Haz 2026',    days: 5, type: 'Yıllık',  status: 'pending'  },
  { name: 'Murat Doğan',  range: '30 May 2026',       days: 1, type: 'Rapor',   status: 'approved' },
  { name: 'Tolga Güneş',  range: '18-19 Haz 2026',    days: 2, type: 'Yıllık',  status: 'pending'  },
  { name: 'Deniz Korkmaz',range: '25 Haz 2026',       days: 1, type: 'Mazeret', status: 'approved' },
  { name: 'Serkan Avcı',  range: '30 Haz-02 Tem 2026',days: 3, type: 'Yıllık',  status: 'pending'  },
  { name: 'Hakan Çelik',  range: '14 Haz 2026',       days: 1, type: 'Rapor',   status: 'rejected' },
];

const OVERTIME = [
  { name: 'Can Öztürk',   date: '11 Haz 2026', hours: '2.5 sa', desc: 'Aylık kapanış raporu',      status: 'pending'  },
  { name: 'Mehmet Kaya',  date: '05 Haz 2026', hours: '1.0 sa', desc: 'Stok sayımı',               status: 'approved' },
  { name: 'Emre Şentürk', date: '09 Haz 2026', hours: '3.0 sa', desc: 'Acil sevkiyat hazırlığı',   status: 'approved' },
  { name: 'Burak Yıldız', date: '12 Haz 2026', hours: '1.5 sa', desc: 'Sunucu bakım penceresi',    status: 'pending'  },
  { name: 'Gizem Polat',  date: '08 Haz 2026', hours: '2.0 sa', desc: 'Kampanya lansman desteği',  status: 'approved' },
  { name: 'Onur Kara',    date: '02 Haz 2026', hours: '2.0 sa', desc: 'Sürüm yayını desteği',      status: 'approved' },
  { name: 'Pınar Yalçın', date: '03 Haz 2026', hours: '1.0 sa', desc: 'Müşteri sunumu hazırlığı',  status: 'approved' },
  { name: 'Selin Acar',   date: '06 Haz 2026', hours: '1.5 sa', desc: 'Yeni personel oryantasyonu',status: 'pending'  },
  { name: 'Murat Doğan',  date: '07 Haz 2026', hours: '2.5 sa', desc: 'Depo envanteri',            status: 'approved' },
  { name: 'Ahmet Yılmaz', date: '10 Haz 2026', hours: '1.0 sa', desc: 'Ay sonu kapanış',           status: 'pending'  },
];

const HOLIDAYS_2026 = [
  { date: '01 Ocak 2026',     name: 'Yılbaşı',                                  type: 'Tam Gün'  },
  { date: '20-22 Mart 2026',  name: 'Ramazan Bayramı',                          type: 'Tam Gün'  },
  { date: '23 Nisan 2026',    name: 'Ulusal Egemenlik ve Çocuk Bayramı',        type: 'Tam Gün'  },
  { date: '01 Mayıs 2026',    name: 'Emek ve Dayanışma Günü',                   type: 'Tam Gün'  },
  { date: '19 Mayıs 2026',    name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",  type: 'Tam Gün'  },
  { date: '27-30 Mayıs 2026', name: 'Kurban Bayramı',                           type: 'Tam Gün'  },
  { date: '15 Temmuz 2026',   name: 'Demokrasi ve Milli Birlik Günü',           type: 'Tam Gün'  },
  { date: '30 Ağustos 2026',  name: 'Zafer Bayramı',                            type: 'Tam Gün'  },
  { date: '28 Ekim 2026',     name: 'Cumhuriyet Bayramı (Yarım Gün)',           type: 'Yarım Gün'},
  { date: '29 Ekim 2026',     name: 'Cumhuriyet Bayramı',                       type: 'Tam Gün'  },
];

const AUDIT_LOG = [
  { time: '12 Haz 09:44', actor: 'Sistem', action: 'login',   target: 'users · Nazlı Çakır' },
  { time: '12 Haz 09:10', actor: 'Berkay Ölçer', action: 'approve', target: 'leave_requests · Onur Kara' },
  { time: '12 Haz 08:58', actor: 'Berkay Ölçer', action: 'update',  target: 'users · Can Öztürk (telefon güncellendi)' },
  { time: '12 Haz 08:55', actor: 'Sistem', action: 'login',   target: 'users · Mustafa Aydın' },
  { time: '11 Haz 18:20', actor: 'Berkay Ölçer', action: 'update',  target: 'settings · ofis IP güncellendi' },
  { time: '11 Haz 17:40', actor: 'Berkay Ölçer', action: 'delete',  target: 'attendance · hatalı kayıt silindi (Hakan Çelik)' },
  { time: '11 Haz 15:12', actor: 'Berkay Ölçer', action: 'reject',  target: 'leave_requests · Can Öztürk' },
  { time: '11 Haz 11:05', actor: 'Berkay Ölçer', action: 'approve', target: 'overtime_requests · Emre Şentürk' },
  { time: '11 Haz 09:02', actor: 'Sistem', action: 'login',   target: 'users · Selin Acar' },
  { time: '10 Haz 16:45', actor: 'Berkay Ölçer', action: 'create',  target: 'users · Nazlı Çakır eklendi' },
  { time: '10 Haz 14:30', actor: 'Berkay Ölçer', action: 'update',  target: 'holidays · 2026 tatil listesi güncellendi' },
  { time: '10 Haz 08:50', actor: 'Sistem', action: 'login',   target: 'users · Ahmet Yılmaz' },
];

const REPORTS_HISTORY = [
  { period: 'Mayıs 2026',   dept: 'Tüm Departmanlar', created: '01 Haz 2026, 09:15' },
  { period: 'Nisan 2026',   dept: 'Tüm Departmanlar', created: '01 May 2026, 09:10' },
  { period: 'Mart 2026',    dept: 'Satış',            created: '02 Nis 2026, 10:02' },
  { period: 'Mart 2026',    dept: 'Tüm Departmanlar', created: '01 Nis 2026, 09:05' },
  { period: 'Şubat 2026',   dept: 'Tüm Departmanlar', created: '01 Mar 2026, 09:12' },
  { period: 'Ocak 2026',    dept: 'IT',               created: '02 Şub 2026, 11:20' },
  { period: 'Ocak 2026',    dept: 'Tüm Departmanlar', created: '01 Şub 2026, 09:08' },
  { period: 'Aralık 2025',  dept: 'Tüm Departmanlar', created: '01 Oca 2026, 09:30' },
  { period: 'Kasım 2025',   dept: 'Muhasebe',         created: '02 Ara 2025, 10:45' },
  { period: 'Kasım 2025',   dept: 'Tüm Departmanlar', created: '01 Ara 2025, 09:14' },
  { period: 'Ekim 2025',    dept: 'Tüm Departmanlar', created: '01 Kas 2025, 09:09' },
  { period: 'Eylül 2025',   dept: 'Lojistik',         created: '02 Eki 2025, 14:02' },
  { period: 'Eylül 2025',   dept: 'Tüm Departmanlar', created: '01 Eki 2025, 09:11' },
];

// Bildirimler — "dakika önce" değerleri sayfa yüklendiği anda sabitlenir
const NOTIFICATIONS = [
  { id: 'n1', title: 'Yeni izin talebi',          message: "Selin Acar 10-16 Haz 2026 tarihleri için yıllık izin talebinde bulundu.",   type: 'info',    is_read: false, link: 'approvals',    minutesAgo: 8 },
  { id: 'n2', title: 'Mesai talebi onay bekliyor', message: "Can Öztürk 11 Haz 2026 için 2.5 saatlik mesai talebi gönderdi.",            type: 'warning', is_read: false, link: 'approvals',    minutesAgo: 47 },
  { id: 'n3', title: 'İzin talebi onaylandı',      message: "Ahmet Yılmaz'ın 01-05 Haz 2026 yıllık izin talebi onaylandı.",              type: 'success', is_read: false, link: 'leaves',       minutesAgo: 130 },
  { id: 'n4', title: 'Hatalı ağ girişinden çıkış', message: "Can Öztürk ofis dışı bir IP adresinden (88.231.4.2) çıkış kaydı oluşturdu.", type: 'error',   is_read: true,  link: 'movements',    minutesAgo: 320 },
  { id: 'n5', title: 'Yeni personel eklendi',      message: "Nazlı Çakır sisteme personel olarak eklendi.",                              type: 'success', is_read: true,  link: 'users',        minutesAgo: 1500 },
  { id: 'n6', title: 'Aylık rapor hazır',          message: "Mayıs 2026 dönemine ait devam raporu oluşturuldu.",                          type: 'info',    is_read: true,  link: 'reports',      minutesAgo: 2600 },
  { id: 'n7', title: 'Tatil günü güncellendi',     message: "2026 resmi tatil listesi güncellendi.",                                      type: 'info',    is_read: true,  link: 'holidays',     minutesAgo: 4200 },
];

const NOTIF_TYPE_ICON = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
const NOTIF_TYPE_CLASS = {
  success: 'ap-notif-item--success', error: 'ap-notif-item--error',
  warning: 'ap-notif-item--warning', info: 'ap-notif-item--info',
};

// ============================================================
// Lucide ikon render yardımcıları
// ============================================================
function icon(name, cls = 'icon') {
  return `<i data-lucide="${name}" class="${cls}"></i>`;
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// Tablo durumu — sıralama + sayfalama
// Her tablo kendi id'si ile state taşır (örn. 'users', 'movements')
// ============================================================
const TABLE_STATE = {};

function getTableState(id, defaults) {
  if (!TABLE_STATE[id]) {
    TABLE_STATE[id] = { page: 1, sortKey: defaults.key, sortDir: defaults.dir, perPage: defaults.perPage || 8 };
  }
  return TABLE_STATE[id];
}

function setSort(id, key) {
  const st = TABLE_STATE[id];
  if (st.sortKey === key) {
    st.sortDir = st.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    st.sortKey = key;
    st.sortDir = 'asc';
  }
  st.page = 1;
  render();
}

function setPage(id, page) {
  TABLE_STATE[id].page = page;
  render();
}

function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    const av = a[key], bv = b[key];
    let cmp;
    if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv), 'tr');
    return dir === 'asc' ? cmp : -cmp;
  });
}

function paginate(rows, page, perPage) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return { rows: rows.slice(start, start + perPage), page: safePage, totalPages, total };
}

// Son sayfada eksik kalan satırları gizli "doldurma" satırlarıyla tamamlar,
// böylece tablo yüksekliği her sayfada sabit kalır ve pagination butonları kaymaz.
function fillerRows(count, cols) {
  if (count <= 0) return '';
  const cells = '<td>&nbsp;</td>'.repeat(cols);
  return `<tr class="filler-row">${cells}</tr>`.repeat(count);
}

// Sıralanabilir tablo başlığı (<th> tıklanınca sıralama yönünü değiştirir)
function th(tableId, key, label) {
  const st = TABLE_STATE[tableId];
  let ind = icon('chevrons-up-down', 'icon icon-sm sort-icon');
  if (st && st.sortKey === key) {
    ind = st.sortDir === 'asc'
      ? icon('chevron-up', 'icon icon-sm sort-icon active')
      : icon('chevron-down', 'icon icon-sm sort-icon active');
  }
  return `<th class="sortable" onclick="setSort('${tableId}','${key}')">${label}${ind}</th>`;
}

function paginationControls(tableId, page, totalPages, total, perPage) {
  if (totalPages <= 1) return '';
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  let pageBtns = '';
  for (let i = 1; i <= totalPages; i++) {
    pageBtns += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="setPage('${tableId}', ${i})">${i}</button>`;
  }
  return `
    <div class="pagination">
      <div class="pagination-pages">
        <button class="page-btn" onclick="setPage('${tableId}', ${page - 1})" ${page === 1 ? 'disabled' : ''}>${icon('chevron-left', 'icon icon-sm')}</button>
        ${pageBtns}
        <button class="page-btn" onclick="setPage('${tableId}', ${page + 1})" ${page === totalPages ? 'disabled' : ''}>${icon('chevron-right', 'icon icon-sm')}</button>
      </div>
      <div class="pagination-info">${from}–${to} / ${total} kayıt</div>
    </div>`;
}

// ============================================================
// Sidebar render
// ============================================================
function renderSidebar(activeId) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = ADMIN_MODULES.map(group => `
    <div class="nav-group">
      <div class="nav-group-label">${group.group}</div>
      ${group.items.map(item => `
        <div class="nav-item ${item.id === activeId ? 'active' : ''} ${item.locked ? 'locked' : ''}"
             data-page="${item.locked ? '' : item.id}"
             data-label="${item.label}"
             title="${item.locked ? 'Henüz aktif değil — ' + item.lockNote : ''}">
          <span class="nav-icon">${icon(item.icon)}</span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          ${item.locked ? `<span class="nav-badge">${item.lockNote}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  nav.querySelectorAll('.nav-item[data-page]:not([data-page=""])').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  refreshIcons();
}

// ============================================================
// Sayfa içerikleri (mock data ile)
// ============================================================
const PAGES = {

  dashboard: () => {
    const enteredNames = MOVEMENTS.filter(m => m.type === 'Giriş').map(m => m.name);
    const exitedNames = new Set(MOVEMENTS.filter(m => m.type === 'Çıkış').map(m => m.name));
    const insideNames = enteredNames.filter(n => !exitedNames.has(n));
    const inside = insideNames.length;
    const total = USERS.length;
    const onLeave = USERS.filter(u => u.status === 'leave');
    const pendingLeaves = LEAVES.filter(l => l.status === 'pending');
    const pendingOvertime = OVERTIME.filter(o => o.status === 'pending');
    const upcomingHolidays = HOLIDAYS_2026.slice(0, 3);
    const deptCounts = DEPARTMENTS.map(d => ({ dept: d, count: USERS.filter(u => u.dept === d).length }));
    const maxDept = Math.max(...deptCounts.map(d => d.count));
    const firstName = (USERS[0] && USERS[0].name.split(' ')[0]) || '';

    return `
    <div class="greeting">
      <div>
        <h2>İyi günler, ${firstName}</h2>
        <div class="greeting-sub">Şu an ofiste <strong>${inside}</strong> kişi var · <strong>${pendingLeaves.length + pendingOvertime.length}</strong> talep onayınızı bekliyor</div>
      </div>
      <div class="greeting-date">${icon('calendar-days')} <span>12 Haziran 2026, Cuma</span></div>
    </div>

    <div class="stat-grid">
      ${statCard('door-open', 'Şu An İçeride', `${inside} / ${total}`, `Personelin %${Math.round(inside / total * 100)}'i ofiste`, 'inside', 'info')}
      ${statCard('inbox', 'Bekleyen Onaylar', `${pendingLeaves.length + pendingOvertime.length}`, `${pendingLeaves.length} izin · ${pendingOvertime.length} mesai talebi`, 'pending', 'warning')}
      ${statCard('palmtree', 'Bugün İzinli', `${onLeave.length}`, onLeave.map(u => u.name).join(', ') || 'Yok', 'onleave', 'success')}
      ${statCard('users', 'Toplam Personel', `${total}`, '4 yönetici · 20 personel', 'total', 'accent')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">
          <span>Son Aktiviteler</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('audit')">${icon('arrow-right', 'icon icon-sm')} Tüm Geçmişi Gör</button>
        </div>
        <div class="activity-list">
          ${AUDIT_LOG.slice(0, 6).map(a => activityItem(a.actor, auditActionLabel(a.action) + ' · ' + a.target, a.time)).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Hızlı Erişim</div>
        <div style="display:flex; flex-direction:column; gap: var(--space-2)">
          <button class="btn btn-primary" style="justify-content:flex-start" onclick="navigate('users')">${icon('user-plus')} Yeni Personel Ekle</button>
          <button class="btn btn-ghost" style="justify-content:flex-start" onclick="navigate('approvals')">${icon('inbox')} Bekleyen Onayları Gör</button>
          <button class="btn btn-ghost" style="justify-content:flex-start" onclick="navigate('reports')">${icon('download')} Aylık Excel Raporu İndir</button>
          <button class="btn btn-ghost" style="justify-content:flex-start" onclick="navigate('holidays')">${icon('calendar-plus')} Tatil Günü Ekle</button>
        </div>
      </div>
    </div>

    <div class="widget-grid">
      <div class="card">
        <div class="card-title">
          <span>Bekleyen İzin Talepleri</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('approvals')">${icon('arrow-right', 'icon icon-sm')}</button>
        </div>
        <div class="widget-list">
          ${pendingLeaves.length ? pendingLeaves.slice(0, 3).map(l => `
            <div class="widget-row">
              <span>${l.name}</span>
              <span class="widget-meta">${l.range} · ${l.days} gün</span>
            </div>`).join('') : `<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>`}
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="navigate('leaves')">${icon('calendar-days', 'icon icon-sm')} Tüm İzinleri Gör</button>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Yaklaşan Tatiller</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('holidays')">${icon('arrow-right', 'icon icon-sm')}</button>
        </div>
        <div class="widget-list">
          ${upcomingHolidays.map(h => `
            <div class="widget-row">
              <span>${h.name}</span>
              <span class="widget-meta">${h.date}</span>
            </div>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="navigate('holidays')">${icon('sun', 'icon icon-sm')} Tüm Tatilleri Gör</button>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Departman Dağılımı</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('users')">${icon('arrow-right', 'icon icon-sm')}</button>
        </div>
        <div class="widget-list">
          ${deptCounts.map(d => `
            <div class="widget-row">
              <span>${d.dept}</span>
              <div class="dept-bar"><div class="dept-bar-fill" style="width:${(d.count / maxDept * 100)}%"></div></div>
              <span class="widget-meta">${d.count}</span>
            </div>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="navigate('users')">${icon('users', 'icon icon-sm')} Tüm Personeli Gör</button>
      </div>
    </div>
  `;
  },

  movements: () => {
    const id = 'movements';
    const st = getTableState(id, { key: 'time', dir: 'asc', perPage: 8 });
    const sorted = sortRows(MOVEMENTS, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <input class="input" placeholder="Personel ara..." />
        <input class="input" type="date" style="max-width:160px" value="2026-06-12" />
        <div class="toolbar-spacer"></div>
        <button class="btn btn-ghost">${icon('download')} Excel'e Aktar</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'name', 'Personel')}
            ${th(id, 'type', 'Tür')}
            ${th(id, 'time', 'Saat')}
            ${th(id, 'status', 'Durum')}
            ${th(id, 'ip', 'IP')}
          </tr></thead>
          <tbody>
            ${rows.map(m => movementRow(m.name, m.type, m.time, m.status, m.ip)).join('')}
            ${fillerRows(st.perPage - rows.length, 5)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  approvals: () => {
    const pendingLeaves = LEAVES.filter(l => l.status === 'pending');
    const pendingOvertime = OVERTIME.filter(o => o.status === 'pending');
    return `
    <div class="card">
      <div class="card-title">İzin Talepleri (${pendingLeaves.length})</div>
      ${pendingLeaves.map(l => approvalCard(l.name, `${l.range} · ${l.days} gün · ${l.type}`, leaveNote(l))).join('')}
    </div>
    <div class="card" style="margin-top: var(--space-4)">
      <div class="card-title">Mesai Talepleri (${pendingOvertime.length})</div>
      ${pendingOvertime.map(o => approvalCard(o.name, `${o.date} · ${o.hours}`, `"${o.desc}"`)).join('')}
    </div>
  `;
  },

  users: () => {
    const id = 'users';
    const st = getTableState(id, { key: 'name', dir: 'asc', perPage: 8 });
    const sorted = sortRows(USERS, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <input class="input" placeholder="Ad, ID veya departman ara..." />
        <select class="input" style="max-width:200px">
          <option>Tüm Departmanlar</option>
          ${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}
        </select>
        <div class="toolbar-spacer"></div>
        <button class="btn btn-primary">${icon('user-plus')} Yeni Personel</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'name', 'Personel')}
            ${th(id, 'dept', 'Departman')}
            ${th(id, 'role', 'Rol')}
            ${th(id, 'balance', 'İzin Bakiyesi')}
            ${th(id, 'status', 'Durum')}
            <th></th>
          </tr></thead>
          <tbody>
            ${rows.map(u => userRow(u.name, u.dept, u.role, u.balance, u.status)).join('')}
            ${fillerRows(st.perPage - rows.length, 6)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  leaves: () => {
    const id = 'leaves';
    const st = getTableState(id, { key: 'name', dir: 'asc', perPage: 6 });
    const sorted = sortRows(LEAVES, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <select class="input" style="max-width:180px">
          <option>Tümü</option>
          <option>Bekleyen</option>
          <option>Onaylanan</option>
          <option>Reddedilen</option>
        </select>
        <div class="toolbar-spacer"></div>
        <span class="badge badge-muted">${LEAVES.length} talep</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'name', 'Personel')}
            ${th(id, 'range', 'Tarih Aralığı')}
            ${th(id, 'days', 'Gün')}
            ${th(id, 'type', 'Tür')}
            ${th(id, 'status', 'Durum')}
          </tr></thead>
          <tbody>
            ${rows.map(l => leaveRow(l.name, l.range, l.days, l.type, l.status)).join('')}
            ${fillerRows(st.perPage - rows.length, 5)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  overtime: () => {
    const id = 'overtime';
    const st = getTableState(id, { key: 'date', dir: 'asc', perPage: 6 });
    const sorted = sortRows(OVERTIME, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <span class="badge badge-muted">${OVERTIME.length} talep</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'name', 'Personel')}
            ${th(id, 'date', 'Tarih')}
            ${th(id, 'hours', 'Süre')}
            ${th(id, 'desc', 'Açıklama')}
            ${th(id, 'status', 'Durum')}
          </tr></thead>
          <tbody>
            ${rows.map(o => overtimeRow(o.name, o.date, o.hours, o.desc, o.status)).join('')}
            ${fillerRows(st.perPage - rows.length, 5)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  reports: () => {
    const id = 'reports';
    const st = getTableState(id, { key: 'period', dir: 'desc', perPage: 6 });
    const sorted = sortRows(REPORTS_HISTORY, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="card-title">Aylık Devam Raporu</div>
      <div class="form-grid" style="margin-bottom: var(--space-4)">
        <div class="form-field">
          <label class="label">Ay</label>
          <input class="input" type="month" value="2026-06" />
        </div>
        <div class="form-field">
          <label class="label">Departman</label>
          <select class="input">
            <option>Tüm Departmanlar</option>
            ${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="label">Format</label>
          <select class="input"><option>Excel (.xlsx)</option><option>CSV</option></select>
        </div>
      </div>
      <button class="btn btn-primary">${icon('download')} Excel Olarak İndir</button>
    </div>

    <div class="card" style="margin-top: var(--space-4)">
      <div class="card-title">Geçmiş Raporlar</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'period', 'Dönem')}
            ${th(id, 'dept', 'Departman')}
            ${th(id, 'created', 'Oluşturulma')}
            <th></th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.period}</td>
                <td>${r.dept}</td>
                <td>${r.created}</td>
                <td><button class="btn btn-ghost btn-sm">${icon('download', 'icon icon-sm')} İndir</button></td>
              </tr>
            `).join('')}
            ${fillerRows(st.perPage - rows.length, 4)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  holidays: () => {
    const id = 'holidays';
    const st = getTableState(id, { key: 'date', dir: 'asc', perPage: 6 });
    const sorted = sortRows(HOLIDAYS_2026, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <select class="input" style="max-width:120px"><option>2026</option><option>2027</option></select>
        <div class="toolbar-spacer"></div>
        <button class="btn btn-primary">${icon('calendar-plus')} Tatil Günü Ekle</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'date', 'Tarih')}
            ${th(id, 'name', 'Adı')}
            ${th(id, 'type', 'Tür')}
            <th></th>
          </tr></thead>
          <tbody>
            ${rows.map(h => `
              <tr>
                <td>${h.date}</td>
                <td>${h.name}</td>
                <td><span class="badge badge-muted">${h.type}</span></td>
                <td><button class="btn btn-ghost btn-sm">${icon('trash-2', 'icon icon-sm')} Sil</button></td>
              </tr>
            `).join('')}
            ${fillerRows(st.perPage - rows.length, 4)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  settings: () => `
    ${typeof appearanceCardHTML === 'function' ? appearanceCardHTML() : ''}
    <div class="card" style="margin-bottom: var(--space-4)">
      <div class="card-title">Genel</div>
      <div class="form-grid">
        <div class="form-field"><label class="label">Şirket Adı</label><input class="input" value="Acme Yazılım A.Ş." /></div>
        <div class="form-field"><label class="label">Ofis IP Adresi</label><input class="input" value="192.168.1.10" /></div>
        <div class="form-field"><label class="label">Haftalık Çalışma Günü</label><input class="input" value="6" type="number" /></div>
        <div class="form-field"><label class="label">Yuvarlama Eşiği (dk)</label><input class="input" value="30" type="number" /></div>
      </div>
    </div>
    <div class="card" style="margin-bottom: var(--space-4)">
      <div class="card-title">Vardiya Saatleri</div>
      <div class="form-grid">
        <div class="form-field"><label class="label">Vardiya Başlangıç</label><input class="input" type="time" value="09:00" /></div>
        <div class="form-field"><label class="label">Vardiya Bitiş</label><input class="input" type="time" value="18:00" /></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Mola Kuralları</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Eşik (saat)</th><th>Kesinti (dk)</th><th></th></tr></thead>
          <tbody>
            <tr><td>4.0</td><td>15</td><td><button class="btn btn-ghost btn-sm">${icon('trash-2', 'icon icon-sm')}</button></td></tr>
            <tr><td>7.5</td><td>60</td><td><button class="btn btn-ghost btn-sm">${icon('trash-2', 'icon icon-sm')}</button></td></tr>
          </tbody>
        </table>
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top: var(--space-3)">${icon('plus', 'icon icon-sm')} Kural Ekle</button>
    </div>
    <div style="margin-top: var(--space-4)">
      <button class="btn btn-primary">${icon('save')} Kaydet</button>
    </div>
  `,

  audit: () => {
    const id = 'audit';
    const st = getTableState(id, { key: 'time', dir: 'asc', perPage: 8 });
    const sorted = sortRows(AUDIT_LOG, st.sortKey, st.sortDir);
    const { rows, page, totalPages, total } = paginate(sorted, st.page, st.perPage);
    return `
    <div class="card">
      <div class="toolbar">
        <input class="input" placeholder="Kullanıcı veya işlem ara..." />
        <select class="input" style="max-width:180px">
          <option>Tüm İşlemler</option>
          <option>Giriş/Çıkış</option>
          <option>Onay/Red</option>
          <option>Düzenleme</option>
          <option>Silme</option>
        </select>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th(id, 'time', 'Zaman')}
            ${th(id, 'actor', 'Kullanıcı')}
            ${th(id, 'action', 'İşlem')}
            ${th(id, 'target', 'Hedef')}
          </tr></thead>
          <tbody>
            ${rows.map(a => auditRow(a.time, a.actor, a.action, a.target)).join('')}
            ${fillerRows(st.perPage - rows.length, 4)}
          </tbody>
        </table>
      </div>
      ${paginationControls(id, page, totalPages, total, st.perPage)}
    </div>
  `;
  },

  notifications: () => {
    const unread = NOTIFICATIONS.filter(n => !n.is_read).length;
    const groups = groupNotifsByDay(NOTIFICATIONS);
    return `
    <div class="ap-np-page">
      ${unread > 0 ? `
        <div class="ap-np-toolbar">
          <button class="ap-np-read-all-btn" onclick="markAllNotifsRead()" type="button">${icon('check', 'icon icon-sm')} Tümünü Okundu İşaretle</button>
        </div>` : ''}
      ${groups.length === 0
        ? `<div class="card ap-notif-empty">
             <div class="ap-notif-empty-icon">${icon('bell', 'icon icon-lg')}</div>
             <p>Bildirim yok</p>
           </div>`
        : groups.map(g => `
            <div class="ap-np-group">
              <div class="ap-np-day-label">${g.label}</div>
              <div class="card ap-np-group-card">
                ${g.rows.map(notifFullItemHTML).join('')}
              </div>
            </div>
          `).join('')}
    </div>
  `;
  },

  // Kilitli / yakında gelecek modüller için ortak placeholder
  branches: () => lockedModule('map-pin', 'Şube Sistemi', 'Bu modül Kademe 1 kapsamında eklenecek. Birden fazla şubesi olan şirketler için şube bazlı personel ve hareket filtrelemesi sağlayacak.'),
  roles:    () => lockedModule('shield', 'Rol & Yetki Yönetimi', 'Bu modül Kademe 2 kapsamında eklenecek. RBAC veritabanı (roller, izinler) zaten hazır — bu sayfa admin\'in özel roller oluşturup yetki ataması yapmasını sağlayacak.'),
  billing:  () => lockedModule('credit-card', 'Plan & Faturalama', 'Bu modül Kademe 3 (SaaS) kapsamında eklenecek. Abonelik planı, kota ve fatura yönetimi burada olacak.'),
};

// ============================================================
// Yardımcı render fonksiyonları
// ============================================================
function statCard(iconName, label, value, foot, modalType, theme = 'accent') {
  const cardClasses = `card stat-card stat-theme-${theme}${modalType ? ' stat-card-clickable' : ''}`;
  const clickAttr = modalType ? ` onclick="openStatModal('${modalType}')"` : '';
  return `
    <div class="${cardClasses}"${clickAttr}>
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        <span class="stat-icon stat-icon-${theme}">${icon(iconName)}</span>
      </div>
      <div class="stat-value tnum" data-countup="${value}">${value}</div>
      <div class="stat-foot">${foot}</div>
    </div>`;
}

function activityItem(actor, action, time) {
  return `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${actor}</strong> ${action}</div>
        <div class="activity-time">${time}</div>
      </div>
    </div>`;
}

function auditActionLabel(action) {
  return {
    approve: 'onayladı', reject: 'reddetti', update: 'güncelledi',
    delete: 'sildi', create: 'oluşturdu', login: 'giriş yaptı',
  }[action] || action;
}

function movementRow(name, type, time, status, ip) {
  const badge = status === 'success' ? '<span class="badge badge-success">Başarılı</span>' : '<span class="badge badge-error">Hatalı Ağ</span>';
  return `<tr><td>${cellUser(name)}</td><td>${type}</td><td>${time}</td><td>${badge}</td><td>${ip}</td></tr>`;
}

function leaveNote(l) {
  const notes = {
    'Selin Acar': '"Yıllık iznimi kullanmak istiyorum."',
    'Zeynep Kaya': '"Doktor raporu ekte."',
    'Büşra Aksoy': '"Yaz tatili planı."',
  };
  return notes[l.name] || '"İzin talebi detayları."';
}

function approvalCard(name, meta, note) {
  return `
    <div class="approval-card">
      <div>
        ${cellUser(name)}
        <div class="approval-meta">${meta}</div>
        <div class="approval-meta" style="margin-top:4px">${note}</div>
      </div>
      <div class="approval-actions">
        <button class="btn btn-primary btn-sm">${icon('check', 'icon icon-sm')} Onayla</button>
        <button class="btn btn-ghost btn-sm">${icon('x', 'icon icon-sm')} Reddet</button>
      </div>
    </div>`;
}

function userRow(name, dept, role, balance, status) {
  const roleLabels = { admin: 'Admin', mudur: 'Müdür', takim_lideri: 'Takım Lideri', personel: 'Personel' };
  const roleBadge = role === 'admin' ? 'badge-primary' : 'badge-muted';
  const statusBadge = {
    active:   '<span class="badge badge-success">Aktif</span>',
    leave:    '<span class="badge badge-warning">İzinli</span>',
    inactive: '<span class="badge badge-muted">Pasif</span>',
  }[status];
  return `<tr>
    <td>${cellUser(name)}</td>
    <td>${dept}</td>
    <td><span class="badge ${roleBadge}">${roleLabels[role]}</span></td>
    <td>${balance} gün</td>
    <td>${statusBadge}</td>
    <td><button class="btn btn-ghost btn-sm">${icon('pencil', 'icon icon-sm')} Düzenle</button></td>
  </tr>`;
}

function leaveRow(name, range, days, type, status) {
  const statusBadge = {
    pending:  '<span class="badge badge-warning">Bekliyor</span>',
    approved: '<span class="badge badge-success">Onaylandı</span>',
    rejected: '<span class="badge badge-error">Reddedildi</span>',
  }[status];
  return `<tr><td>${cellUser(name)}</td><td>${range}</td><td>${days}</td><td>${type}</td><td>${statusBadge}</td></tr>`;
}

function overtimeRow(name, date, hours, desc, status) {
  const statusBadge = status === 'pending' ? '<span class="badge badge-warning">Bekliyor</span>' : '<span class="badge badge-success">Onaylandı</span>';
  return `<tr><td>${cellUser(name)}</td><td>${date}</td><td>${hours}</td><td>${desc}</td><td>${statusBadge}</td></tr>`;
}

function auditRow(time, actor, action, target) {
  const actionLabels = { approve: 'Onaylama', reject: 'Reddetme', update: 'Güncelleme', delete: 'Silme', create: 'Oluşturma', login: 'Giriş' };
  const actionBadges = { approve: 'badge-success', reject: 'badge-error', update: 'badge-primary', delete: 'badge-error', create: 'badge-success', login: 'badge-muted' };
  return `<tr><td>${time}</td><td>${actor}</td><td><span class="badge ${actionBadges[action]}">${actionLabels[action]}</span></td><td>${target}</td></tr>`;
}

function cellUser(name) {
  const init = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="cell-user"><div class="cell-avatar">${init}</div><div class="cell-main"><strong>${name}</strong></div></div>`;
}

function lockedModule(iconName, title, desc) {
  return `
    <div class="card locked-module">
      <div class="lock-icon">${icon(iconName, 'icon icon-lg')}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>`;
}

// ============================================================
// Bildirimler — ortak yardımcılar (panel + sayfa)
// ============================================================
function notifTimeAgo(n) {
  const m = n.minutesAgo;
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

function notifDayKey(n) {
  const dt = new Date(Date.now() - n.minutesAgo * 60000);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function notifDayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const todayKey = notifDayKey({ minutesAgo: 0 });
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yestKey = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
  if (key === todayKey) return `Bugün · ${dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
  if (key === yestKey)  return `Dün · ${dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
  const diff = Math.floor((Date.now() - dt.getTime()) / 86400000);
  if (diff < 7) return `${dt.toLocaleDateString('tr-TR', { weekday: 'long' })} · ${dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupNotifsByDay(rows) {
  const map = new Map();
  for (const n of rows) {
    const key = notifDayKey(n);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(n);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, rows]) => ({ dayKey: key, label: notifDayLabel(key), rows }));
}

function notifItemHTML(n) {
  return `
    <div class="ap-notif-item ${NOTIF_TYPE_CLASS[n.type] || ''} ${n.is_read ? '' : 'ap-notif-item--unread'}"
         data-id="${n.id}" data-link="${n.link || ''}">
      <div class="ap-notif-item-dot">${NOTIF_TYPE_ICON[n.type] || 'ℹ'}</div>
      <div class="ap-notif-item-body">
        <p class="ap-notif-item-title">${n.title}</p>
        <p class="ap-notif-item-msg">${n.message}</p>
        <p class="ap-notif-item-time">${notifTimeAgo(n)}</p>
      </div>
      <button class="ap-notif-del-btn" data-del="${n.id}" type="button" title="Sil">${icon('x', 'icon icon-sm')}</button>
    </div>`;
}

function notifFullItemHTML(n) {
  return `
    <div class="ap-notif-item ap-np-full-item ${NOTIF_TYPE_CLASS[n.type] || ''} ${n.is_read ? '' : 'ap-notif-item--unread'}"
         data-id="${n.id}" data-link="${n.link || ''}">
      <div class="ap-notif-item-dot">${NOTIF_TYPE_ICON[n.type] || 'ℹ'}</div>
      <div class="ap-notif-item-body">
        <div class="ap-np-item-row">
          <p class="ap-notif-item-title">${n.title}</p>
          <span class="ap-notif-item-time">${notifTimeAgo(n)}</span>
        </div>
        <p class="ap-notif-item-msg">${n.message}</p>
      </div>
      <button class="ap-notif-del-btn" data-del="${n.id}" type="button" title="Sil">${icon('x', 'icon icon-sm')}</button>
    </div>`;
}

function updateNotifDot() {
  const dot = document.getElementById('notif-dot');
  if (!dot) return;
  dot.style.display = NOTIFICATIONS.some(n => !n.is_read) ? '' : 'none';
}

function markAllNotifsRead() {
  NOTIFICATIONS.forEach(n => n.is_read = true);
  updateNotifDot();
  if (notifPanelOpen) renderNotifPanel();
  if ((location.hash.replace('#/', '') || 'dashboard') === 'notifications') render();
}

function markNotifRead(id) {
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (n && !n.is_read) {
    n.is_read = true;
    updateNotifDot();
  }
}

function deleteNotif(id) {
  const idx = NOTIFICATIONS.findIndex(n => n.id === id);
  if (idx !== -1) NOTIFICATIONS.splice(idx, 1);
  updateNotifDot();
  if (notifPanelOpen) renderNotifPanel();
  if ((location.hash.replace('#/', '') || 'dashboard') === 'notifications') render();
}

// ============================================================
// Bildirim paneli — Topbar çanına tıklanınca açılan dropdown
// ============================================================
let notifPanelOpen = false;

function toggleNotifPanel(e) {
  e.stopPropagation();
  notifPanelOpen ? closeNotifPanel() : openNotifPanel();
}

function openNotifPanel() {
  notifPanelOpen = true;
  renderNotifPanel();
  document.addEventListener('click', onNotifOutsideClick, { capture: true });
}

function closeNotifPanel() {
  notifPanelOpen = false;
  const panel = document.getElementById('ap-notif-panel');
  if (panel) panel.remove();
  document.removeEventListener('click', onNotifOutsideClick, true);
}

function onNotifOutsideClick(e) {
  const panel = document.getElementById('ap-notif-panel');
  const bell = document.getElementById('notif-bell-btn');
  if (panel && !panel.contains(e.target) && bell && !bell.contains(e.target)) {
    closeNotifPanel();
  }
}

function renderNotifPanel() {
  let panel = document.getElementById('ap-notif-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'ap-notif-panel';
    panel.className = 'ap-notif-panel';
    document.body.appendChild(panel);
  }

  const bell = document.getElementById('notif-bell-btn');
  const rect = bell.getBoundingClientRect();
  const top = rect.bottom + 8;
  if (window.innerWidth < 480) {
    panel.style.top = `${top}px`;
    panel.style.left = '8px';
    panel.style.right = '8px';
    panel.style.width = 'auto';
  } else {
    const right = window.innerWidth - rect.right;
    panel.style.top = `${top}px`;
    panel.style.left = '';
    panel.style.right = `${Math.max(4, right - 8)}px`;
    panel.style.width = '360px';
  }

  const unread = NOTIFICATIONS.filter(n => !n.is_read).length;

  panel.innerHTML = `
    <div class="ap-notif-panel-header">
      <span class="ap-notif-panel-title">${icon('bell', 'icon icon-sm')} Bildirimler</span>
      <div class="ap-notif-panel-actions">
        ${unread > 0 ? `<button class="ap-notif-read-all-btn" type="button" onclick="markAllNotifsRead()">${icon('check', 'icon icon-sm')} Tümünü Oku</button>` : ''}
        <button class="ap-notif-close-btn" type="button" onclick="closeNotifPanel()">${icon('x', 'icon icon-sm')}</button>
      </div>
    </div>
    <div class="ap-notif-list">
      ${NOTIFICATIONS.length === 0
        ? `<div class="ap-notif-empty">
             <div class="ap-notif-empty-icon">${icon('bell', 'icon icon-lg')}</div>
             <p>Bildirim yok</p>
           </div>`
        : NOTIFICATIONS.map(notifItemHTML).join('')}
    </div>
    <div class="ap-notif-panel-footer">
      <button class="ap-notif-view-all-btn" type="button" onclick="closeNotifPanel(); navigate('notifications')">Tümünü Gör</button>
    </div>
  `;

  panel.querySelectorAll('.ap-notif-item').forEach(item => {
    item.onclick = (e) => {
      if (e.target.closest('.ap-notif-del-btn')) return;
      const id = item.dataset.id;
      const link = item.dataset.link;
      markNotifRead(id);
      item.classList.remove('ap-notif-item--unread');
      if (link) { closeNotifPanel(); navigate(link); }
    };
  });

  panel.querySelectorAll('.ap-notif-del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteNotif(btn.dataset.del);
    };
  });

  refreshIcons();
}

// ============================================================
// Modal — Genel Bakış'taki stat kartlarına tıklayınca detay gösterir
// ============================================================
function showModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.add('open');
  refreshIcons();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'modal-overlay') closeModal();
}

function openStatModal(type) {
  if (type === 'inside') {
    const enteredNames = MOVEMENTS.filter(m => m.type === 'Giriş').map(m => m.name);
    const exitedNames = new Set(MOVEMENTS.filter(m => m.type === 'Çıkış').map(m => m.name));
    const insideNames = enteredNames.filter(n => !exitedNames.has(n));
    const rows = insideNames.map(name => {
      const mv = MOVEMENTS.find(m => m.name === name && m.type === 'Giriş');
      const u = USERS.find(u => u.name === name);
      return `<div class="widget-row"><span>${name}</span><span class="widget-meta">${u ? u.dept + ' · ' : ''}${mv ? mv.time : ''}</span></div>`;
    }).join('');
    showModal('Şu An İçeride', `
      <div class="widget-list">${rows}</div>
      <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="closeModal(); navigate('movements')">${icon('clock', 'icon icon-sm')} Tüm Hareketleri Gör</button>
    `);
  } else if (type === 'pending') {
    const pendingLeaves = LEAVES.filter(l => l.status === 'pending');
    const pendingOvertime = OVERTIME.filter(o => o.status === 'pending');
    const leaveRows = pendingLeaves.map(l => `<div class="widget-row"><span>${l.name}</span><span class="widget-meta">${l.range} · ${l.days} gün · ${l.type}</span></div>`).join('');
    const overtimeRows = pendingOvertime.map(o => `<div class="widget-row"><span>${o.name}</span><span class="widget-meta">${o.date} · ${o.hours}</span></div>`).join('');
    showModal('Bekleyen Onaylar', `
      <div class="modal-section-title">İzin Talepleri (${pendingLeaves.length})</div>
      <div class="widget-list">${leaveRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
      <div class="modal-section-title">Mesai Talepleri (${pendingOvertime.length})</div>
      <div class="widget-list">${overtimeRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
      <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center" onclick="closeModal(); navigate('approvals')">${icon('check-check', 'icon icon-sm')} Onaylar Sayfasına Git</button>
    `);
  } else if (type === 'onleave') {
    const onLeave = USERS.filter(u => u.status === 'leave');
    const rows = onLeave.map(u => {
      const l = LEAVES.find(l => l.name === u.name);
      return `<div class="widget-row"><span>${u.name}</span><span class="widget-meta">${u.dept}${l ? ' · ' + l.range : ''}</span></div>`;
    }).join('');
    showModal('Bugün İzinli', `
      <div class="widget-list">${rows || '<div class="widget-row"><span class="widget-meta">Bugün izinli kimse yok</span></div>'}</div>
      <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="closeModal(); navigate('leaves')">${icon('calendar-days', 'icon icon-sm')} Tüm İzinleri Gör</button>
    `);
  } else if (type === 'total') {
    const deptCounts = DEPARTMENTS.map(d => ({ dept: d, count: USERS.filter(u => u.dept === d).length }));
    const roleCounts = {
      admin: USERS.filter(u => u.role === 'admin').length,
      mudur: USERS.filter(u => u.role === 'mudur').length,
      takim_lideri: USERS.filter(u => u.role === 'takim_lideri').length,
      personel: USERS.filter(u => u.role === 'personel').length,
    };
    const maxDept = Math.max(...deptCounts.map(d => d.count));
    const deptRows = deptCounts.map(d => `
      <div class="widget-row">
        <span>${d.dept}</span>
        <div class="dept-bar"><div class="dept-bar-fill" style="width:${(d.count / maxDept * 100)}%"></div></div>
        <span class="widget-meta">${d.count}</span>
      </div>`).join('');
    showModal('Toplam Personel', `
      <div class="modal-section-title">Departmana Göre</div>
      <div class="widget-list">${deptRows}</div>
      <div class="modal-section-title">Role Göre</div>
      <div class="widget-list">
        <div class="widget-row"><span>Admin</span><span class="widget-meta">${roleCounts.admin}</span></div>
        <div class="widget-row"><span>Müdür</span><span class="widget-meta">${roleCounts.mudur}</span></div>
        <div class="widget-row"><span>Takım Lideri</span><span class="widget-meta">${roleCounts.takim_lideri}</span></div>
        <div class="widget-row"><span>Personel</span><span class="widget-meta">${roleCounts.personel}</span></div>
      </div>
      <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" onclick="closeModal(); navigate('users')">${icon('users', 'icon icon-sm')} Tüm Personeli Gör</button>
    `);
  }
}

// ============================================================
// Mobil sidebar (drawer) aç/kapat
// ============================================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// Masaüstü: kenar çubuğunu daralt/genişlet (icon-rail) — paylaşımlı görünüm durumu
function toggleRail() {
  const shell = document.getElementById('admin-shell');
  const next = shell.getAttribute('data-sidebar') === 'collapsed' ? 'expanded' : 'collapsed';
  if (typeof setTweak === 'function') {
    setTweak({ sidebar: next });
  } else {
    shell.setAttribute('data-sidebar', next);
    const ico = document.getElementById('rail-icon');
    if (ico) { ico.setAttribute('data-lucide', next === 'collapsed' ? 'panel-left-open' : 'panel-left-close'); refreshIcons(); }
  }
}

// ============================================================
// Router — hash tabanlı (gerçek uygulamada Router.ts kullanılır)
// ============================================================
function navigate(pageId) {
  location.hash = '#/' + pageId;
  closeSidebar();
}

// Sayfaya göre iskelet (skeleton) — gerçek içerik gelene kadar akışkan yükleme hissi
function skeletonFor(id) {
  if (id === 'dashboard') {
    return `
      <div class="sk sk-line" style="width:260px;height:28px;margin-bottom:26px"></div>
      <div class="stat-grid">${'<div class="sk sk-stat"></div>'.repeat(4)}</div>
      <div class="grid-2">
        <div class="sk" style="height:300px;border-radius:var(--radius-lg)"></div>
        <div class="sk" style="height:300px;border-radius:var(--radius-lg)"></div>
      </div>`;
  }
  if (id === 'settings') {
    return `${'<div class="sk" style="height:160px;border-radius:var(--radius-lg);margin-bottom:16px"></div>'.repeat(3)}`;
  }
  if (id === 'approvals') {
    return `${'<div class="sk" style="height:220px;border-radius:var(--radius-lg);margin-bottom:16px"></div>'.repeat(2)}`;
  }
  return `
    <div class="card">
      <div class="sk sk-line" style="width:300px;height:40px;margin-bottom:22px"></div>
      ${'<div class="sk sk-row"></div>'.repeat(8)}
    </div>`;
}

// Sayı sayacı — stat kartlarındaki rakamlar 0'dan hedefe akar
function runCountUps(scope) {
  if (document.hidden) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  scope.querySelectorAll('[data-countup]').forEach(el => {
    const raw = el.getAttribute('data-countup');
    const m = raw.match(/\d[\d.]*/);
    if (!m) return;
    const target = parseFloat(m[0].replace(/\./g, ''));
    if (!isFinite(target) || target === 0) return;
    const prefix = raw.slice(0, m.index);
    const suffix = raw.slice(m.index + m[0].length);
    const dur = 720, start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick); else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  });
}

let renderToken = 0;
function render() {
  const id = (location.hash.replace('#/', '') || 'dashboard');
  const meta = PAGE_META[id] || PAGE_META.dashboard;
  const pageFn = PAGES[id] || PAGES.dashboard;

  document.getElementById('page-title').textContent = meta.title;
  document.getElementById('page-sub').textContent = meta.sub;
  renderSidebar(id);

  const content = document.getElementById('content');
  const token = ++renderToken;

  // 1) Önce iskelet — akışkan yükleme
  content.classList.remove('page-enter');
  content.innerHTML = skeletonFor(id);
  content.classList.add('skeleton-page');

  // 2) Kısa bir an sonra gerçek içerik (kademeli belirir + sayaç)
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    if (token !== renderToken) return; // daha yeni navigasyon geldiyse iptal
    content.classList.remove('skeleton-page');
    content.innerHTML = pageFn();
    void content.offsetWidth;
    // Animasyonu yalnızca sayfa görünürken oynat; donup içeriği gizlemesin diye kısa süre sonra temizle
    if (!document.hidden && !reduce) {
      content.classList.add('page-enter');
      setTimeout(() => content.classList.remove('page-enter'), 720);
    }
    refreshIcons();
    runCountUps(content);
    if (id === 'notifications') wireNotifPage();
  }, reduce ? 0 : 190);
}

// Bildirimler sayfasındaki tam-genişlik kartların tıklama/silme davranışı
function wireNotifPage() {
  document.querySelectorAll('.ap-np-full-item').forEach(item => {
    item.onclick = (e) => {
      if (e.target.closest('.ap-notif-del-btn')) return;
      const id = item.dataset.id;
      const link = item.dataset.link;
      markNotifRead(id);
      item.classList.remove('ap-notif-item--unread');
      if (link) navigate(link);
    };
  });
  document.querySelectorAll('.ap-np-full-item .ap-notif-del-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteNotif(btn.dataset.del);
    };
  });
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => { updateNotifDot(); render(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); if (typeof closeTweaks === 'function') closeTweaks(); } });
