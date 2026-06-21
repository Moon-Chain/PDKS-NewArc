# PDKS — Geliştirme Kılavuzu

Bu belgeyi okuyarak geliştirme yapılır.
Her kademe bağımsız teslim edilebilir bir üründür.
Kademe bitmeden sonrakine geçilmez.

---

## Bu Belge Nasıl Kullanılır?

1. Aktif kademeyi bul
2. "Tamamlandı Kriteri"ni oku — bitişi orada
3. Geliştirme sırasını takip et — atlamak sorun yaratır
4. Her dosyayı bitirince üstünü çiz / işaretle
5. Bir sonraki kademedeki dosyalara dokunma

---

## UI/UX Tasarım Sistemi

Tüm kademelerde aynı tasarım dili. Bunu bir kez kur, hep kullan.

### CSS Değişkenleri (Tek Kaynak)

```css
/* public/css/style.css */
:root {
  /* Renkler */
  --color-bg:        #09090b;   /* Sayfa arka planı */
  --color-card:      #18181b;   /* Kart arka planı */
  --color-border:    #27272a;   /* Kenar rengi */
  --color-text:      #fafafa;   /* Ana metin */
  --color-muted:     #71717a;   /* Soluk metin */
  --color-primary:   #f97316;   /* Ana aksiyon rengi (turuncu) */
  --color-success:   #22c55e;
  --color-error:     #ef4444;
  --color-warning:   #eab308;
  --color-info:      #3b82f6;

  /* Tipografi */
  --font-size-xs:   11px;
  --font-size-sm:   13px;
  --font-size-base: 15px;
  --font-size-lg:   18px;
  --font-size-xl:   22px;

  /* Boşluk */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;

  /* Köşe yuvarlaklığı */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  20px;
  --radius-xl:  28px;
}
```

### Temel Bileşenler (Bir Kez Yaz, Hep Kullan)

```css
/* Butonlar */
.btn         { padding: 10px 20px; border-radius: var(--radius-md); font-weight: 600; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-ghost   { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); }
.btn-danger  { background: var(--color-error); color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Kartlar */
.card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); }

/* Form elemanları */
.input { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 14px; color: var(--color-text); width: 100%; }
.input:focus { border-color: var(--color-primary); outline: none; }
.label { font-size: var(--font-size-sm); color: var(--color-muted); font-weight: 500; margin-bottom: var(--space-1); display: block; }

/* Badge */
.badge { padding: 2px 8px; border-radius: 99px; font-size: var(--font-size-xs); font-weight: 700; }
.badge-success { background: rgba(34,197,94,0.1); color: var(--color-success); }
.badge-error   { background: rgba(239,68,68,0.1);  color: var(--color-error); }
.badge-warning { background: rgba(234,179,8,0.1);  color: var(--color-warning); }
.badge-muted   { background: rgba(113,113,122,0.1); color: var(--color-muted); }
```

---

## Mevcut Projede Gereksiz / Kötü Şeyler (Yeni Versiyonda Yapılmayacaklar)

Bu hatalar tekrarlanmayacak.

### UX Hataları

**1. Giriş/Çıkış Durumu Belirsiz**
Ekrana bakınca "şu an içeride miyim yoksa dışarıda mıyım?" anlaşılmıyor.
✅ Çözüm: Ana sayfanın tepesinde büyük, net durum göstergesi:
```
🟢 İÇERİDESİN — Giriş: 08:47
```
veya
```
⚫ DIŞARIDASIN — Son çıkış: 18:22
```

**2. QR Scanner Gereksiz Yere Tam Ekran**
Kamera görüntüsü tam ekran açılıyor, kullanıcıyı korkutuyor.
✅ Çözüm: Sayfanın ortasında küçük, kare alan (max 320px). Üstünde iptal butonu.

**3. Cooldown Geri Sayımı Yok**
"60 saniye bekleyin" yazıyor ama kaç saniye kaldığı görünmüyor.
✅ Çözüm: `"Lütfen 47 saniye bekleyin"` — gerçek zamanlı sayaç.

**4. Form Hataları Sadece Toast**
Zorunlu alan boş bırakılınca toast geliyor, kullanıcı hangi alanı göremez.
✅ Çözüm: Her input'un altında inline hata mesajı:
```html
<input class="input error" ...>
<span class="field-error">Bu alan zorunludur</span>
```

**5. Boş Durum Ekranları Yok**
Liste boşsa beyaz/siyah ekran görünüyor.
✅ Çözüm: Her liste için boş durum:
```
📋 Henüz izin talebi yok
    [Yeni Talep Oluştur]
```

**6. Skeleton Loader Yok**
Veri yüklenirken ekran boş kalıyor.
✅ Çözüm: Her liste için gri animasyonlu placeholder satırlar.

**7. Yıkıcı İşlemlerde Onay Yok / Yetersiz**
"Sil" butonuna basınca doğrudan siliniyor.
✅ Çözüm: Her yıkıcı işlemde Modal ile onay + sebep alanı.

**8. Bildirim Rozeti Sayısı Olmayan Sekmeler**
Bekleyen izin/mesai sayısı sadece "Onaylar" sekmesinde görünüyor.
✅ Çözüm: SSE ile anlık güncellenen badge — hem nav'da hem sayfa başlığında.

**9. Sayfa Geçişlerinde Flash**
Sayfa değişince beyaz bir an görünüyor.
✅ Çözüm: `opacity` ile basit fade:
```css
.page-enter { animation: fadeIn 150ms ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
```

**10. Mobil'de Büyük Formlar Zor**
Uzun formlar kaydırmayı zorlaştırıyor, klavye açılınca input'lar kayboluyor.
✅ Çözüm: `position: fixed; bottom: 0` ile submit butonu her zaman görünür.

### Gereksiz Şeyler

- `framer-motion` + `motion/react` aynı anda — sadece Alpine transitions yeterli
- `fingerprintjs` — device ID için `Math.random` + `crypto.randomUUID` yeterli
- `@google/genai` — şimdilik gerekmez, sonra eklenecek
- `react-qr-barcode-scanner` + `html5-qrcode` — ikisi birden gereksiz, biri seçilecek
- `qrcode.react` — Vanilla'da `qrcode` npm paketi veya API ile üretilir

---

## Kademe 0 — Temel (Temiz Yeniden Yazım)

**Hedef:** Şu anki tüm özellikleri temiz mimaride çalıştır.
Firebase yok, React yok, Vite yok. PostgreSQL + Node.js + Vanilla.js + Alpine.js.

**Tahmini süre:** 3-4 ay
**Teslim kriteri:** Mevcut sistemin yapabildiği her şey, yeni sistemde de çalışır.

### Kademe 0a — DB + Auth (2-3 hafta)

**Dosyalar:**
```
db/
  connection.ts
  migrate.ts
  migrations/
    001_companies.sql
    002_initial_schema.sql
core/
  AppError.ts
  BaseRepository.ts
  BaseService.ts
  Logger.ts
shared/
  constants.ts
  types/
    user.ts
    company.ts
    api.ts
repositories/
  UserRepository.ts
  CompanyRepository.ts
services/
  AuthService.ts
middleware/
  auth.ts
  tenant.ts
  roles.ts
  rateLimit.ts
  validate.ts
  requestId.ts
routes/v1/
  auth.ts
server.ts
public/
  index.html
  css/style.css
  css/components.css
  ts/core/
    Router.ts
    ApiClient.ts
    StateManager.ts
    EventBus.ts
    BasePage.ts
    BaseComponent.ts
  ts/components/
    Toast.ts
    Modal.ts
    Skeleton.ts
  ts/pages/
    LoginPage.ts
  ts/app.ts
build.ts
.env + .env.example
```

**Geliştirme sırası:**
```
1. db/connection.ts
2. db/migrate.ts + migrations/001_companies.sql + 002_initial_schema.sql
3. npm run migrate → tablolar oluştu
4. core/AppError.ts + core/Logger.ts
5. core/BaseRepository.ts (SQL injection güvenli)
6. core/BaseService.ts
7. shared/constants.ts + shared/types/
8. repositories/UserRepository.ts + CompanyRepository.ts
9. services/AuthService.ts
10. middleware/auth.ts + tenant.ts + roles.ts + rateLimit.ts + validate.ts + requestId.ts
11. routes/v1/auth.ts
12. server.ts (Express iskelet + graceful shutdown)
13. public/css/style.css + components.css (tasarım sistemi)
14. public/ts/core/ (Router, ApiClient, StateManager, BasePage, BaseComponent)
15. public/ts/components/Toast.ts + Modal.ts + Skeleton.ts
16. public/ts/pages/LoginPage.ts
17. public/ts/app.ts
18. build.ts (esbuild)
19. npm run dev → login çalışıyor
```

**Tamamlandı Kriteri:**
- [ ] `npm run migrate` hatasız tamamlanıyor
- [ ] Login sayfası açılıyor, tasarım tutarlı
- [ ] Yanlış şifre → inline hata değil, toast (burada uygun)
- [ ] Doğru şifre → `/home`'a yönlendiriyor (boş sayfa da olsa)
- [ ] `/auth/me` 401 dönüyor → login'e yönlendiriyor
- [ ] Logout çalışıyor

---

### Kademe 0b — Attendance + Ana Sayfa (2-3 hafta)

**Dosyalar:**
```
repositories/AttendanceRepository.ts
services/AttendanceService.ts
routes/v1/attendance.ts
routes/v1/events.ts          ← SSE stream
events/emitter.ts
events/setup.ts
public/ts/core/EventStream.ts
public/ts/pages/HomePage.ts
public/ts/components/BottomNav.ts
public/ts/components/QRScanner.ts
public/ts/components/StatusIndicator.ts   ← İçeride/Dışarıda göstergesi
```

**Ana Sayfa UI (kesin olacak şeyler):**
```
┌─────────────────────────────┐
│ Merhaba, Ahmet              │ ← isim + rol badge
│                             │
│  ╔═══════════════════════╗  │
│  ║  🟢 İÇERİDESİN       ║  │ ← büyük, net, renkli
│  ║  Giriş: 08:47         ║  │
│  ╚═══════════════════════╝  │
│                             │
│  [QR ile Giriş] [QR ile Çıkış] │ ← iki büyük buton
│                             │
│  Bugünkü Hareketler        │
│  ─────────────────         │
│  ↑ Giriş    08:47          │
│  ↓ Çıkış    12:30          │
│  ↑ Giriş    13:00          │
└─────────────────────────────┘
```

**Geliştirme sırası:**
```
1. AttendanceRepository.ts
2. AttendanceService.ts (IP kontrolü, QR doğrulama, offline mantığı)
3. routes/v1/attendance.ts
4. events/emitter.ts + setup.ts
5. routes/v1/events.ts (SSE)
6. EventStream.ts (frontend SSE istemcisi)
7. StatusIndicator.ts bileşeni (içeride/dışarıda)
8. QRScanner.ts bileşeni (küçük, kare, 320px max)
9. BottomNav.ts (role göre değişen sekmeler)
10. HomePage.ts (Alpine.data + yukarıdaki UI)
```

**Tamamlandı Kriteri:**
- [ ] Giriş/Çıkış durumu ana sayfada büyük ve net görünüyor
- [ ] QR kamera açılıyor, okutma çalışıyor
- [ ] IP kontrolü çalışıyor (yanlış IP → hata)
- [ ] Bugünkü hareketler listede görünüyor
- [ ] İnternet kesilince "Çevrimdışı" banner'ı çıkıyor
- [ ] Offline giriş kaydediliyor, bağlantı gelince senkronize oluyor
- [ ] SSE bağlantısı açılıyor (Network sekmesinden kontrol)
- [ ] Cooldown sayacı geri sayım gösteriyor

---

### Kademe 0c — Kullanıcı Yönetimi (2-3 hafta)

**Dosyalar:**
```
services/UserService.ts
routes/v1/users.ts
routes/v1/settings.ts
repositories/SettingsRepository.ts
services/SettingsService.ts
services/StorageService.ts     ← dosya yükleme (disk veya R2)
public/ts/pages/UsersPage.ts
public/ts/pages/SettingsPage.ts
public/ts/pages/ProfilePage.ts
```

**Kullanıcı Listesi UI:**
```
┌────────────────────────────────────┐
│ Personel Yönetimi    [+ Yeni Ekle] │
│ ─────────────────────────────────  │
│ 🔍 Ara...                          │
│                                    │
│ [Ahmet Yılmaz]  Muhasebe  Müdür   │
│ [Mehmet Kaya]   Satış     Personel │
│ [Ayşe Demir]    IT        Admin    │
│                                    │
│ Yükleniyor... (skeleton)           │
└────────────────────────────────────┘
```

**Tamamlandı Kriteri:**
- [ ] Personel listesi sayfalama ile açılıyor
- [ ] Yeni personel ekleniyor (form doğrulaması çalışıyor)
- [ ] Personel düzenleniyor
- [ ] Personel pasife alınıyor (silme yok, soft delete)
- [ ] Şifre sıfırlama (admin) çalışıyor
- [ ] Profil fotoğrafı yüklenebiliyor
- [ ] Ayarlar kaydediliyor (ofis IP, QR sırrı, vardiya)
- [ ] QR kodu ekranda gösteriliyor ve yazdırılabiliyor

---

### Kademe 0d — İzin + Mesai + Onaylar (2-3 hafta)

**Dosyalar:**
```
repositories/LeaveRepository.ts
repositories/OvertimeRepository.ts
services/LeaveService.ts
services/OvertimeService.ts
routes/v1/leaves.ts
routes/v1/overtime.ts
public/ts/pages/LeavesPage.ts
public/ts/pages/OvertimePage.ts
public/ts/pages/ApprovalsPage.ts
```

**İzin Talebi UI:**
```
┌─────────────────────────────────┐
│ İzin Talebi                     │
│                                 │
│ Kalan İzin: 14 gün  🏖️          │
│                                 │
│ Başlangıç: [____] Bitiş: [____] │
│ Hesaplanan: 3 iş günü           │
│                                 │
│ Tür: ○ Yıllık ○ Rapor ○ Mazeret │
│                                 │
│ Açıklama: [___________________] │
│                                 │
│ Belge: [Dosya Seç] (opsiyonel) │
│                                 │
│         [Talep Gönder]          │
└─────────────────────────────────┘
```

**Onaylar UI:**
```
┌──────────────────────────────────────┐
│ Bekleyen Onaylar (3)                 │
│ ─────────────────────────────────── │
│ İzin Talepleri (2)                   │
│ ┌──────────────────────────────────┐ │
│ │ Ahmet Yılmaz • 3 gün • Yıllık   │ │
│ │ 15-17 Haziran 2026               │ │
│ │ "Aile ziyareti"                  │ │
│ │ [Onayla ✓]  [Reddet ✗]          │ │
│ └──────────────────────────────────┘ │
│ Manuel Kayıtlar (1)                  │
│ ...                                  │
└──────────────────────────────────────┘
```

**Tamamlandı Kriteri:**
- [ ] İzin talebi oluşturuluyor, bakiye düşüyor
- [ ] Yönetici onaylar → push bildirimi geliyor
- [ ] Yönetici reddeder → push bildirimi geliyor
- [ ] Mesai talebi oluşturuluyor
- [ ] Otomatik mesai tespiti (çıkış saatinden) çalışıyor
- [ ] Manuel kayıt talebi → yönetici onayı → 'success' statüsü
- [ ] Tatil günleri izin hesabına dahil edilmiyor

---

### Kademe 0e — Bildirimler + Push (1-2 hafta)

**Dosyalar:**
```
repositories/NotificationRepository.ts
services/NotificationService.ts
routes/v1/notifications.ts
routes/v1/push.ts
routes/v1/holidays.ts
repositories/HolidayRepository.ts
public/ts/pages/ProfilePage.ts     (push izni buradan isteniyor)
public/ts/components/NotificationPanel.ts
```

**Tamamlandı Kriteri:**
- [ ] Uygulama açıkken bildirim geliyor (SSE)
- [ ] Uygulama kapalıyken push bildirimi geliyor
- [ ] Bildirimlere tıklayınca doğru sayfaya gidiyor
- [ ] Bildirim sayısı nav'da görünüyor
- [ ] Tatil günleri admin panelinden eklenebiliyor/silinebiliyor

---

### Kademe 0f — Excel + PWA + Offline + Cilalama (1-2 hafta)

**Dosyalar:**
```
services/ExcelService.ts
public/ts/offline.ts     ← IndexedDB kuyruk
public/sw.ts
public/manifest.json
```

**Tamamlandı Kriteri:**
- [ ] Excel raporu doğru hesaplamalarla indiriliyor
- [ ] PWA: telefona yükleme seçeneği çıkıyor
- [ ] Offline: giriş/çıkış kuyruğa alınıyor
- [ ] Online gelince kuyruk senkronize oluyor
- [ ] Tüm sayfalar skeleton loader gösteriyor
- [ ] Tüm listeler boş durum ekranı gösteriyor
- [ ] Tüm yıkıcı işlemlerde onay modalı var
- [ ] Responsive: 320px - 1280px arası düzgün görünüyor
- [ ] Sentry entegrasyonu çalışıyor (test hatası fırlatılıyor)
- [ ] CI/CD: `git push` → otomatik deploy
- [ ] Uptime Robot: `/health` endpoint izleniyor

---

### Kademe 0 Tamamlandı Kriteri (Tüm Alt Kademeler)

- [ ] Şu anki Firebase projesiyle birebir aynı özellikler çalışıyor
- [ ] Mobil tarayıcıda sorunsuz kullanılabiliyor
- [ ] 3 farklı rol (admin, müdür, personel) test edildi
- [ ] Offline senaryosu test edildi
- [ ] Push bildirimleri test edildi
- [ ] Excel raporu doğru çıkıyor
- [ ] Performans: ilk yükleme < 3 saniye

---

## Kademe 1 — Şube Sistemi

**Hedef:** Bir şirketin birden fazla şubesi olabilir.
Genel müdür tüm şubeleri, şube personeli sadece kendi şubesini görür.

**Tahmini süre:** 1-2 hafta
**Bağımlılık:** Kademe 0 tamamlanmış olmalı

### Geliştirme Sırası

```
1. db/migrations/010_add_branches.sql çalıştır
2. shared/types/branch.ts
3. BranchRepository.ts (BaseRepository'den 10 satır extend)
4. BranchService.ts (Redis cache dahil)
5. BaseRepository.ts — branchId opsiyonel filtre eklendi
6. AuthService.ts — JWT'ye branch_id eklendi
7. middleware/tenant.ts — req.branchId eklendi
8. Her servisin getPage metoduna branchId iletildi
9. routes/v1/branches.ts + server.ts'e 1 satır
10. Permissions seed SQL (3 satır)
11. public/ts/pages/BranchesPage.ts (Alpine.js)
12. BottomNav.ts — admin için "Şubeler" sekmesi
```

**Şube Yönetimi UI:**
```
┌─────────────────────────────────┐
│ Şubeler               [+ Yeni]  │
│ ─────────────────────────────── │
│ 📍 Ankara Merkez    12 personel │
│    Atatürk Cad. No:5 • Ankara   │
│    [Düzenle] [Deaktif]          │
│                                 │
│ 📍 İstanbul Şubesi  8 personel  │
│    Bağdat Cad. No:22 • İstanbul │
│    [Düzenle] [Deaktif]          │
└─────────────────────────────────┘
```

**Personel Formuna Eklenenler:**
```
Şube: [Ankara Merkez ▼]   ← dropdown
```

**Tamamlandı Kriteri:**
- [ ] Şube oluşturulabiliyor, düzenlenebiliyor, deaktif edilebiliyor
- [ ] Personele şube atanabiliyor
- [ ] Genel müdür (branch_id=NULL) tüm şubelerin verilerini görüyor
- [ ] Şube müdürü sadece kendi şubesini görüyor
- [ ] Hareketler ekranında şube filtresi var
- [ ] Şube değişince Redis cache temizleniyor
- [ ] Şube silinirken "personel var" kontrolü çalışıyor

---

## Kademe 2 — Tam Yetki Yönetimi (RBAC UI)

**Hedef:** Admin, sistem üzerinden özel rol oluşturabilir ve izin atayabilir.
Kod değiştirmeden yetki sistemi yönetilebilir.

**Tahmini süre:** 2-3 hafta
**Bağımlılık:** Kademe 1 tamamlanmış olmalı

**Not:** Temel RBAC (4 sabit rol) zaten Kademe 0'da çalışıyor.
Bu kademe admin'e dinamik rol oluşturma UI'ı kazandırır.

### Geliştirme Sırası

```
1. RoleRepository.ts + PermissionRepository.ts
2. RoleService.ts (rol CRUD + izin atama)
3. routes/v1/roles.ts
4. routes/v1/permissions.ts
5. public/ts/pages/RolesPage.ts (Alpine.js)
6. Personel formuna "Özel Rol" dropdown'u eklendi
7. Middleware'de customRole izin kontrolü güncellendi
```

**Rol Yönetimi UI:**
```
┌─────────────────────────────────────┐
│ Rol Yönetimi              [+ Yeni]  │
│ ─────────────────────────────────── │
│ Muhasebe Müdürü           [Düzenle] │
│  ☑ İzin Onaylama                   │
│  ☑ Raporları Görme                  │
│  ☐ Personel Yönetimi               │
│  ☑ Kendi Şubesini Görme            │
│                                    │
│ Saha Koordinatörü         [Düzenle] │
│  ☐ İzin Onaylama                   │
│  ☑ Uzaktan Giriş                   │
│  ☑ Kendi Şubesini Görme            │
└─────────────────────────────────────┘
```

**Tamamlandı Kriteri:**
- [ ] Özel rol oluşturulabiliyor
- [ ] Role izin atanabiliyor (checkbox listesi)
- [ ] Rol düzenlenebiliyor
- [ ] Sistem rolleri (admin, mudur vb.) silinemez, sadece görüntülenir
- [ ] Personele özel rol atanabiliyor
- [ ] Özel role sahip personel doğru izinlerle çalışıyor

---

## Kademe 3 — SaaS

**Hedef:** Birden fazla şirket sistemi kullanabilir.
Self-servis kayıt, plan sistemi, faturalama.

**Tahmini süre:** 3-5 ay
**Bağımlılık:** Kademe 2 tamamlanmış olmalı

**Not:** Bu kademe çok büyük. İkiye bölünebilir:
- **3a:** Self-servis kayıt + plan sistemi (faturasız — admin onaylı)
- **3b:** Faturalama entegrasyonu (Stripe/Iyzico)

### Kademe 3a — Şirket Kayıt + Plan (4-6 hafta)

```
1. routes/v1/register.ts (yeni şirket kaydı)
2. CompanyService.ts — plan ve kota yönetimi
3. E-posta doğrulama akışı (Resend)
4. Onboarding wizard (3 adım: şirket → admin → QR)
5. Admin paneline "Şirket Ayarları" sayfası
6. Kota aşımı uyarıları
```

**Kayıt Akışı:**
```
1. E-posta + şirket adı gir
2. E-postaya doğrulama kodu geldi
3. Kod doğrula → şifre belirle
4. Onboarding: ilk şubeyi oluştur → ilk yöneticiyi ekle → QR kodu yazdır
5. Sistem hazır
```

### Kademe 3b — Faturalama (2-3 ay)

```
1. Stripe veya Iyzico entegrasyonu
2. Plan seçim ekranı (Starter/Pro/Enterprise)
3. Kredi kartı ekleme akışı
4. Fatura oluşturma + PDF
5. Plan değiştirme akışı
6. Deneme süresi yönetimi
7. Ödeme başarısız → hesap askıya alma
```

**Tamamlandı Kriteri (3a):**
- [ ] Şirket self-servis kaydolabiliyor
- [ ] E-posta doğrulama çalışıyor
- [ ] Onboarding tamamlandıktan sonra sistem kullanılabilir
- [ ] Plan kotası aşılınca uyarı veriyor, ekleme engelleniyor

**Tamamlandı Kriteri (3b):**
- [ ] Stripe/Iyzico entegrasyonu çalışıyor
- [ ] Plan değiştirilebiliyor
- [ ] Fatura PDF olarak indirilebiliyor
- [ ] Ödeme başarısız → e-posta uyarısı + 3 günlük tolerans

---

## Kademe 4 — Root Panel

**Hedef:** Sistem sahibinin tüm şirketleri yönettiği ayrı uygulama.

**Tahmini süre:** 1.5-2 ay
**Bağımlılık:** Kademe 3 tamamlanmış olmalı
**Detaylar:** ROOT-PANEL.md dosyasına bakılacak

### Geliştirme Sırası

```
1. root-panel/ klasörü oluştur (ayrı package.json)
2. shared/db/connection.ts paylaşılan bağlantı
3. root-panel/server.ts (port 4000, IP kısıtlı)
4. rootAuth.ts middleware
5. routes/companies.ts (şirket CRUD)
6. routes/stats.ts (istatistikler)
7. routes/impersonate.ts (destek modu)
8. routes/system.ts (migration, cache araçları)
9. public/ (basit Alpine.js panel)
10. Dashboard sayfası
11. Şirket yönetim sayfası
12. Impersonate akışı
```

**Tamamlandı Kriteri:**
- [ ] Sadece root şifre ile erişilebiliyor
- [ ] Tüm şirketler listeleniyor
- [ ] Şirket askıya alınabiliyor/aktif edilebiliyor
- [ ] Impersonate ile şirket admin'i gibi giriş yapılabiliyor
- [ ] İstatistik dashboard çalışıyor
- [ ] Her erişim audit_log'a düşüyor

---

## Genel Geliştirme Kuralları

### Git Stratejisi
```
main           ← Her zaman çalışan kod
dev            ← Aktif geliştirme
feature/0a-auth   ← Alt kademe branch'leri
feature/0b-attendance
feature/1-branches
...
```

Her alt kademe bitince `dev`'e, her ana kademe bitince `main`'e merge.

### Test Zorunluluğu
- Kritik iş mantığı (izin bakiyesi, mola hesabı, IP kontrolü) → unit test şart
- API endpoint'leri → integration test şart
- UI → manuel test yeterli (şimdilik)

### Performans Hedefleri
- İlk yükleme: < 3 saniye (3G bağlantıda)
- API yanıt süresi: < 200ms (p95)
- SSE bağlantısı: < 1 saniye kurulsun

### Güvenlik Kontrol Listesi (Her Kademede)
- [ ] Yeni endpoint'e rate limit eklendi mi?
- [ ] Yetki kontrolü var mı (requireAuth + requirePermission)?
- [ ] Input validation yapılıyor mu?
- [ ] SQL injection mümkün mü? (parametre mi, string mi?)
- [ ] Audit log yazılıyor mu (yıkıcı işlemler için)?

---

## Eksik mi? Değerlendirme

Bu belge ile şu sorulara cevap var:
- ✅ Ne zırasıyla yazılacak?
- ✅ Hangi dosya yazılacak?
- ✅ Kademe ne zaman bitti?
- ✅ UI nasıl görünecek?
- ✅ Hangi UX hataları yapılmayacak?
- ✅ Güvenlik kontrol listesi

Bu belgede yok (kasıtlı — başka belgelerde var):
- Kod örnekleri → MIMARI.md
- Kurulum adımları → KURULUM.md
- API endpoint detayları → api-documentation.md
- Ölçek ve SaaS notları → SAAS-BUYUK-MIMARI.md

---

## Kademe Özet Tablosu

| Kademe | İçerik | Süre | Önce | Durum |
|--------|--------|------|------|-------|
| 0a | DB + Auth | 2-3 hafta | — | ✅ Tamamlandı |
| 0b | Attendance + Ana sayfa | 2-3 hafta | 0a | ✅ Tamamlandı |
| 0c | Kullanıcı yönetimi | 2-3 hafta | 0b | ✅ Tamamlandı |
| 0d | İzin + Mesai + Onaylar | 2-3 hafta | 0c | ✅ Tamamlandı |
| 0e | Bildirimler + Push | 1-2 hafta | 0d | ✅ Tamamlandı |
| 0f | Excel + PWA + Cilalama | 1-2 hafta | 0e | ✅ Tamamlandı |
| **0 Toplam** | **Tam çalışan PDKS** | **3-4 ay** | | ✅ |
| 1 | Şube sistemi | 1-2 hafta | 0 | ⏳ Sıradaki |
| 2 | RBAC UI | 2-3 hafta | 1 | — |
| 2.5 | Teknik borç kapatma | 1-2 hafta | 2 | — |
| 3a | SaaS self-servis | 4-6 hafta | 2.5 | — |
| 3b | SaaS faturalama | 2-3 ay | 3a | — |
| 4 | Root panel | 1.5-2 ay | 3 | — |
| **Toplam** | **Tam SaaS + Root** | **8-14 ay** | | |

---

## Kademe 2.5 — Teknik Borç Kapatma

**Hedef:** Kademe 3 (SaaS) öncesi sistemin sağlam zemine oturtulması.
Bu kademe atlanırsa SaaS geliştirme sırasında hatalar bulunması zorlaşır.

**Tahmini süre:** 1-2 hafta
**Bağımlılık:** Kademe 2 tamamlanmış olmalı

### Yapılacaklar

**1. Test yazımı (kritik iş mantığı)**
```
tests/
  unit/
    leaveBalance.test.ts      ← İzin bakiyesi hesabı
    workDays.test.ts          ← İş günü sayısı (tatil dahil)
    overtimeDetect.test.ts    ← Otomatik mesai tespiti
    ipCheck.test.ts           ← IP kontrolü mantığı
  integration/
    auth.test.ts              ← Login / logout / token blacklist
    attendance.test.ts        ← Giriş/çıkış, cooldown
    leaves.test.ts            ← İzin talebi + bakiye düşürme
```
Araç: Jest + ts-jest. `npm test` ile tüm testler çalışmalı.

**2. Tatil günleri — dinamik yıl desteği**
```
Mevcut sorun: LeavesPage.ts ve MovementsPage.ts içinde 2026 tatilleri
             sabit liste olarak hardcoded. 2027'de yanlış hesaplar.

Çözüm: Frontend tatil listesini her zaman DB'den çekecek.
       /api/v1/holidays?year=XXXX → yıla göre tatiller.
       workDays() fonksiyonu bu listeyi kullanacak.
```

**3. Sentry entegrasyonu**
```
1. sentry.io'da proje aç → DSN al
2. .env → SENTRY_DSN=https://xxx@sentry.io/yyy
3. server.ts → @sentry/node ile backend hataları
4. public/ts/app.ts → @sentry/browser ile frontend hataları
5. Test: kasıtlı hata fırlat → Sentry'de görün
```

**4. CI/CD pipeline**
```
GitHub Actions önerilen yapı:
.github/workflows/deploy.yml
  → push to main tetikler
  → npm test çalıştır (testler geçmezse deploy durur)
  → SSH ile sunucuya bağlan
  → git pull + npm install + npx tsx build.ts + pm2 restart
```

**Tamamlandı Kriteri:**
- [ ] `npm test` → tüm testler yeşil
- [ ] 2027 yılı seçince tatil günleri doğru hesaplanıyor
- [ ] Production'da hata olunca Sentry'e düşüyor
- [ ] `git push main` → sunucu otomatik güncelleniyor

---

*Geliştirme kılavuzu tarihi: 2026-06-03*
