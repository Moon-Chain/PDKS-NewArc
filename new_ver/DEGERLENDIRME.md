# PDKS Yeni Mimari — Kapsamlı Değerlendirme

---

## Mimari Avantajlar (En Az 20 Madde)

### Yapısal Avantajlar

**1. 3 Katmanlı Ayrışma — Route / Service / Repository**
Her katman sadece kendi işini biliyor. Route HTTP bilir, Service iş kuralı bilir,
Repository SQL bilir. Birini değiştirince diğerleri etkilenmiyor.

**2. BaseRepository — Kod Tekrarı Sıfır**
`findById`, `findAll`, `create`, `update`, `softDelete` metodları bir kez yazıldı.
9 repository bundan kalıtım alıyor. 9 × 5 = 45 metod yerine 5 metod.

**3. BaseService — Ortak Yetki Kontrolleri Tek Yerde**
`assertAdmin()`, `assertManagerOf()`, `assertSelfOrAdmin()` her serviste
tekrar yazılmıyor. Bir değişiklik tüm servislere yansıyor.

**4. BasePage + BaseComponent — Frontend'de Tekrar Yok**
Tüm sayfalar `BasePage`'den, tüm bileşenler `BaseComponent`'ten türüyor.
Event listener temizleme otomatik — bellek sızıntısı riski ortadan kalktı.

**5. Event Emitter — Push Bildirimi İş Mantığından Ayrıldı**
`AttendanceService` push bilmiyor, sadece `emitter.emit('attendance:checkin')` diyor.
Push sistemi değişince sadece `events/setup.js` değişir, service dokunulmaz.

**6. Global Hata Handler**
Tüm hatalar `next(err)` ile tek noktaya düşüyor.
Her route'da ayrı `try/catch` + hata mesajı formatlamak yok.

**7. AppError Class — Standart Hata**
`throw new AppError('Yetkisiz', 403)` her yerden fırlatılabilir.
HTTP status kodu iş mantığına gömülmüş, tutarlı API cevapları.

**8. Migration Sistemi**
Tablo değişiklikleri sıralı `.sql` dosyalarıyla yönetiliyor.
Hangisi uygulandı takip ediliyor. Takım çalışmasında kritik.

**9. API Versiyonlama (/api/v1/)**
Gelecekte endpoint değişince eski mobil istemciler bozulmuyor.
v1 çalışmaya devam ederken v2 paralel geliştirilebilir.

**10. Lazy Loading Sayfalar**
`() => import('./pages/HomePage.js')` — sayfa kodları sadece
o sayfaya gidilince yükleniyor. İlk açılış hızlı.

**11. JWT + HTTP-only Cookie**
Token tarayıcı JS'ine erişilebilir değil. XSS saldırısı token çalamaz.
`sameSite: 'strict'` ile CSRF koruması.

**12. Token Blacklist**
Çalıntı token veya anlık oturum kapatma gereksinimi karşılandı.
8 saatlik JWT geçersiz kılınabiliyor.

**13. Audit Log Tablosu**
Kim, ne zaman, neyi değiştirdi kaydı var.
Yasal uyumluluk ve güvenlik incelemesi için kritik.

**14. Soft Delete + deleted_at**
Veriler gerçekten silinmiyor, ne zaman silindiği biliniyor.
Yanlışlıkla silme geri alınabilir.

**15. `updated_at` Otomatik Trigger**
PostgreSQL trigger'ı unutulan `updated_at` sorununu çözüyor.
Kod içinde elle set etme yok, her zaman doğru.

**16. Input Validation Middleware**
Gelen veri route'a girmeden doğrulanıyor.
Hatalı veri Service veya Repository'ye hiç ulaşmıyor.

**17. Pagination Her Sorgu'da**
`findAll({ page, limit })` — tüm listeleme sorgularında sayfalama var.
1000 kayıt yüklemek yerine 50'şer sayfa.

**18. Partial Index — Bildirimler**
`WHERE is_read = false` — sadece okunmamış bildirimler index'te.
Okunmuş binlerce kayıt index'i şişirmiyor.

**19. Offline Queue (IndexedDB)**
İnternet kesilince hareketler tarayıcıda saklanıyor.
Bağlantı gelince otomatik senkronize ediliyor.

**20. Docker Volume Uyarısı**
Yüklenen dosyalar (`uploads/`) container yeniden başlayınca
kaybolmaması için volume mount gerektiği belirtildi.

**21. SW Cache Versiyonlama**
`pdks-v1` → `pdks-v2` ile eski cache temizleniyor.
Deploy sonrası kullanıcılar eski kod görmüyor.

**22. DB Backup Stratejisi**
Coolify otomatik backup + manuel `pg_dump` + `uploads/` ayrı yedek.
Üç katmanlı yedekleme.

**23. Test Stratejisi — Katmana Göre Farklı Test**
Repository → entegrasyon (gerçek DB), Service → unit (mock),
Route → API testi. Her katman doğru araçla test ediliyor.

**24. Modül Ekleme 8 Adımda**
Yeni özellik için şablonlanmış adımlar var, mevcut kodlara dokunulmadan
modül eklenebiliyor.

**25. `npm start` Direkt Çalışır**
Build adımı yok. Vite yok. React yok. Dosyayı kopyala, çalıştır.

---

## Mimari Dezavantajlar (En Az 20 Madde)

### Teknik Dezavantajlar

**1. Sadece Plan — Kod Yok**
Mimari.md bir tasarım belgesi. Hiçbir satır gerçek kod yazılmadı.
Belgeden uygulamaya geçişte sürprizler çıkabilir.

**2. Vanilla JS DOM Yönetimi Büyüyünce Zorlaşır**
`innerHTML` ile sayfa render React gibi otomatik değil.
Karmaşık ekranlar (çok sayıda modal, form, filtre) elle yönetmek zor.

**3. TypeScript Yok — Runtime Hatalar**
Yanlış tip verisi gönderilince hata kod çalışırken patlıyor.
Derleme anında yakalama yok.

**4. Gerçek Zamanlı Güncelleme Yok**
Firebase'in `onSnapshot` gibi anlık güncelleme yok.
Sayfayı yenilemeden değişiklik görünmüyor (polling eklenmeli).

**5. Vanilla JS'te XSS Riski**
`innerHTML = userContent` yazılırsa XSS açığı.
Her `template()` metodunda kullanıcı verisini sanitize etmek unutulabilir.

**6. Redis Ekstra Servis**
Cache istersen Redis de çalışıyor olmalı.
Coolify'da bir servis daha — bakım yükü artıyor.

**7. BullMQ Redis'e Bağımlı**
Job queue için Redis zorunlu. Redis düşerse queue da durur.

**8. Token Blacklist Her İstekte DB Sorgusu**
Her API isteğinde `token_blacklist` tablosuna sorgu.
Çok trafikli sistemde performans sorunu olabilir (Redis'e taşınabilir).

**9. Self-Referencing FK Karmaşıklığı**
`users.manager_id → users.id` — derin hiyerarşilerde
sorgu karmaşıklaşır (recursive CTE gerekebilir).

**10. Dosyalar Sunucu Diskinde**
Profil fotoğrafları ve izin belgeleri `uploads/` klasöründe.
Sunucu değişince ya da ölçeklenince dosyalar kaybolabilir.
CDN veya object storage (S3, R2) daha sağlam olurdu.

**11. Tek Sunucu — Yatay Ölçeklenme Zor**
Dosyalar disk'te, session bilgisi JWT'de ama birden fazla
sunucu olunca `uploads/` paylaşım sorunu çıkar.

**12. API Dokümantasyonu Yok**
Swagger/OpenAPI tanımı yok. Yeni geliştirici endpoint'leri
belgeden öğrenmek zorunda.

**13. Loglama Sistemi Yok**
`console.log` ve `console.error` var.
Winston veya Pino gibi yapılandırılmış loglama yok.
Production'da log dosyası, log seviyesi, log rotasyonu yok.

**14. İzleme/Alarm Sistemi Yok**
Sunucu çökünce kim haberdar olacak?
Sentry, Datadog, Uptime Robot gibi araç entegrasyonu yok.

**15. Rate Limiting Sadece Login'de**
Diğer endpoint'ler sınırsız istek alabiliyor.
`/api/attendance` endpoint'i kötüye kullanılabilir.

**16. Admin İçin 2FA Yok**
Tüm sistemi yönetebilen admin sadece şifreyle korunuyor.

**17. Şifre Sıfırlama Yok**
"Şifremi unuttum" akışı yok. Admin müdahalesi gerekiyor.

**18. Çok Şirket Sonradan Zor**
`company_id` eklenmesi tüm tablolarda değişiklik demek.
Baştan tasarlanmadığı için migration büyük olacak.

**19. QR Sırrı Sunucu Tarafında Doğrulanıyor Ama Kaba Kuvvet Riski**
QR endpoint'ine rate limit yok. Saldırgan deneme yanılma yapabilir.

**20. `BaseRepository.findAll` String Concatenation**
`WHERE ${where}` kısmı parametre ile değil string ile birleştiriliyor.
Yanlış kullanılırsa SQL injection riski. Özenli kullanım gerekiyor.

**21. Tatil Günleri Sadece DB'de — Yönetim Arayüzü Eksik**
`holidays` tablosu var ama admin panelinde tatil ekleme/silme
sayfası geliştirme sırasına girmedi.

**22. Kötü Bağlantı Durumu Tespiti Zayıf**
`navigator.onLine` her zaman güvenilir değil.
Çevrimdışı → çevrimiçi geçişte sync tetiklemek kaçırılabilir.

**23. Sayfa Geçişlerinde Loading State Yok**
Router sayfa yüklerken boş ekran görebilir.
"Yükleniyor..." spinner mekanizması tanımlanmadı.

**24. Frontend Build Adımı Yok — Component Import Sınırı**
`<script type="module">` ile ES modülleri yükleniyor.
Çok sayıda dosya = çok sayıda HTTP isteği.
Üretimde bundle/minify olmadan yavaş olabilir.

---

## Bu Proje Nedir, Kime Hizmet Eder, Ne Kadar Hizmet Eder?

### Proje Tanımı

**PDKS — Personel Devam Kontrol Sistemi**

Şirketteki her personelin işe giriş ve çıkış saatlerini dijital olarak
kaydeden, izin ve mesai taleplerini yöneten, yöneticiye anlık görünürlük
sağlayan bir kurumsal web uygulaması.

Mobil tarayıcıdan erişilebilir, telefona yüklenebilir (PWA),
internet olmadan bile giriş/çıkış kaydı tutabilir.

---

### Kime Hizmet Eder?

**Birincil kullanıcılar:**

| Rol | Ne Yapar |
|-----|----------|
| **Personel** | QR okutarak/IP ile giriş-çıkış yapar, izin ve mesai talebi oluşturur |
| **Takım Lideri** | Ekibinin hareketlerini görür, taleplerini onaylar/reddeder |
| **Müdür** | Yönettiği departmanın tüm verilerini görür |
| **Admin** | Sistemi yönetir, tüm verilere erişir, raporlar alır |

**Hedef şirket profili:**
- 10 ile 500 personel arası
- Ofis + saha/nakliye çalışanları karışık olan şirketler
- Türkiye'de faaliyet gösteren, iş kanununa uyum arayan işletmeler
- Yazılım altyapısı kurmak için bütçesi olmayan KOBİ'ler

---

### Hangi Sorunları Çözüyor?

**1. Kağıt Devam Defteri → Dijital Kayıt**
İmzalı devam defteri kaybolabilir, sahte imza atılabilir, hesaplanması zor.
QR kod + IP kontrolü ile manipülasyon imkânsız hale getirildi.

**2. "Kim giriş yaptı?" Sorusunun Cevabı — Anlık**
Yönetici telefona bakınca şu an ofiste kim var, kim geç geldi,
kim hiç gelmedi görüyor. Araştırma yapmak gerekmiyor.

**3. Buddy Punching (Başkası Adına Giriş)**
Cihaz kısıtlaması: Personel sadece kayıtlı cihazdan giriş yapabiliyor.
QR sırrı: Sadece o an işyerindeki QR kodunu okutabiliyor.

**4. İzin Yönetimi Kâğıtsız**
Kâğıt dilekçe, imza, arşivleme yerine dijital talep → onay → bakiye düşümü.
İzin bakiyesi otomatik hesaplanıyor (Türk iş kanununa göre).

**5. Mesai Takibi ve Anlaşmazlık Önleme**
Çıkış saatine göre otomatik mesai talebi oluşturuluyor.
"Mesai yaptım ama yazılmadı" anlaşmazlıkları kaydıyla çözülüyor.

**6. Nakliye/Saha Personeli**
Ofise gelemeyen şoför veya saha çalışanı uzaktan giriş yapabiliyor,
yönetici onaylıyor. Konum bilgisi de kaydediliyor.

**7. Yasal Uyumluluk**
Türk iş kanunu Madde 68'e göre mola kesintileri otomatik.
Kıdem ve yaşa göre yasal izin günü hesabı dahili.
Yıllık devam raporu Excel olarak SGK/muhasebe için hazır.

**8. İnternet Olmadan Çalışma**
İnternet kesintisinde personel giriş/çıkış yapabiliyor (offline queue).
Bağlantı gelince otomatik senkronize.

**9. Yönetici Bildirimi**
Personel giriş yaptığında yöneticinin telefonuna anında bildirim.
Talep onaylandığında/reddedildiğinde personele bildirim.
Uygulama kapalıyken bile telefona push geliyor.

**10. Mobil Öncelikli**
Masaüstü uygulaması indirmek yok, tarayıcıdan açılıyor.
Telefona "Yükle" seçeneğiyle ikon olarak masaüstüne eklenebiliyor.

---

### Ne Kadar Hizmet Eder?

**Teknik ömür:**
- Mevcut mimariyle 5-7 yıl sorunsuz çalışır
- PostgreSQL + Node.js olgun teknolojiler, uzun ömürlü
- Şema migration sistemi var — tablo yapısı değişebilir
- Redis ve job queue gerektiğinde eklenebilir

**Kapasite:**
- 50-200 personel: Şu an mükemmel
- 200-500 personel: Redis cache eklenince rahat
- 500+ personel: Job queue + read replica gerekir
- 1000+ personel: Multi-tenant mimari revizyonu gerekir

**Gerçek Sınır:**
Tek sunucu (ev PC veya küçük VPS) üzerinde çalıştığı sürece
fiziksel kaynak sınırları belirleyici. Sunucu büyütülürse yazılım
yıllarca hizmet verebilir.

---

### Bu Sistem Olmadan Ne Oluyor?

```
Kâğıt imza defteri        → Kayıp, sahtecilik, hesaplama hatası
Excel tablosu             → Güncellenmez, paylaşılmaz, hata düzeltilmez
Manuel izin takibi        → Bakiye yanlış hesap, anlaşmazlık
WhatsApp grup bildirimi   → Kayıt yok, ispat yok
Geç geleni fark etmemek  → Disiplin sorunu, haksızlık algısı
```

Bu sistem bu sorunların hepsini tek bir araçla çözüyor.

---

## Son Mimari Güncellemeler (Revize — 2026-06-01)

Bu belge ilk yazıldıktan sonra mimari önemli ölçüde gelişti.
Aşağıdaki özellikler eklenmiştir:

**Yeni Eklenenler:**
- Alpine.js ile reaktif frontend (%30 karmaşık ekran için, sıfır build adımı)
- Şube (branch) sistemi — ileriye dönük hazır, 3-5 günlük ek iş
- Graceful shutdown (veri kaybını önler)
- Constants/shared types (tek kaynak)
- Request ID tracking (hata ayıklama)
- esbuild pipeline (TypeScript derleme)
- Logout all devices (token_version)
- 2FA brute force koruması
- CSP özelleştirilmiş
- KURULUM.md (adım adım kurulum)
- SAAS-BUYUK-MIMARI.md (ölçek yol haritası)

**Güncel Belgeler:**
| Dosya | Satır | İçerik |
|-------|-------|--------|
| MIMARI.md | ~4000 | Tam mimari + kod örnekleri |
| KURULUM.md | ~270 | Adım adım kurulum kılavuzu |
| ROOT-PANEL.md | ~250 | Sistem sahibi paneli notları |
| SAAS-BUYUK-MIMARI.md | ~210 | Ölçek ve SaaS yol haritası |
| api-documentation.md | ~150 | Tüm endpoint tablosu |

---

*Değerlendirme tarihi: 2026-06-01 — Revize*

*Değerlendirme tarihi: 2026-06-01*
