# Root Panel — Sistem Sahibi Yönetim Paneli

> Bu belge bir not dosyasıdır. Root panel ayrı bir uygulama olarak
> PDKS uygulaması tamamlandıktan sonra geliştirilecek.

---

## Ne Yapacak?

PDKS sistemine kayıtlı tüm şirketleri, kullanıcıları ve sistemi
tek bir yerden yönetmek için kullanılacak panel.

Sistemi geliştiren ve satan kişinin (yazılım sahibinin) aracı.
Müşteri şirket yöneticileri bu panele erişemez.

```
Müşteri Admin  → pdks-app → sadece kendi şirketini görür
Yazılım Sahibi → root-panel → tüm şirketleri görür, her şeye erişir
```

---

## Nerede Çalışacak?

```
pdks-app    → port 3000 → internete açık (Cloudflare üzerinden)
root-panel  → port 4000 → internete KAPALI

Erişim yöntemi (birini seç):
  A) Sadece sunucuya SSH tünel ile   → ssh -L 4000:localhost:4000 sunucu
  B) Belirli IP'lere kısıtlı         → middleware ile IP whitelist
  C) Cloudflare Access ile korumalı  → SSO + 2FA zorunlu
```

Seçenek C (Cloudflare Access) önerilir — kurulumu kolay, çok güvenli.

---

## Aynı Veritabanı, Farklı Gözler

```
pdks-app middleware:   WHERE company_id = 'jwt'den gelen id'  (filtreli)
root-panel middleware: filtre YOK — tüm şirketler görünür
```

Her iki uygulama `shared/db/connection.js` üzerinden aynı
PostgreSQL'e bağlanır. Root panel company_id kısıtı uygulamaz.

---

## Yapacakları (Planlanan Özellikler)

### Şirket Yönetimi
- [ ] Yeni şirket oluştur (slug, plan, max_users)
- [ ] Şirketi askıya al / aktif et
- [ ] Şirketi tamamen sil (cascade)
- [ ] Şirket planını değiştir (starter → pro)
- [ ] Deneme süresi uzat / sonlandır

### Kullanıcı ve Veri Görüntüleme
- [ ] Tüm şirketlerin kullanıcı listesi
- [ ] Herhangi bir şirketin verilerini görüntüle (destek amaçlı)
- [ ] Bir şirkete "impersonate" olarak giriş yap (destek modu)
- [ ] Şirket bazlı aktif oturum sayısı

### Sistem İstatistikleri
- [ ] Toplam şirket / aktif şirket / deneme süresi biten
- [ ] Toplam kullanıcı sayısı
- [ ] Günlük aktif kullanıcı (DAU)
- [ ] En çok kullanılan özellikler
- [ ] Hata oranları (audit_log'dan)

### Teknik Araçlar
- [ ] DB migration çalıştır (production'da dikkatli)
- [ ] Redis cache temizle (şirket bazlı veya tümü)
- [ ] Job queue durumu (bekleyen görevler, hata verenler)
- [ ] Sunucu sağlığı (RAM, CPU, disk)
- [ ] Yedek alma / geri yükleme

### Özellik Bayrakları (Feature Flags)
- [ ] Belirli şirkete yeni özelliği aç/kapat
- [ ] A/B test grubu tanımla
- [ ] Beta özelliklerini seç şirketlere sun

---

## Teknik Yapı (Taslak)

```
root-panel/
  server.js              ← port 4000, IP kısıtlı
  package.json           ← pdks-app'ten bağımsız
  .env                   ← Aynı DATABASE_URL, ROOT_SECRET ayrı
  │
  ├── middleware/
  │   └── rootAuth.js    ← Tek root kullanıcı, çok güçlü doğrulama
  │
  ├── routes/
  │   ├── companies.js   ← CRUD şirket yönetimi
  │   ├── stats.js       ← İstatistik endpoint'leri
  │   ├── impersonate.js ← Bir şirketin admin'i gibi token üret
  │   ├── system.js      ← Migration, cache, queue araçları
  │   └── flags.js       ← Feature flag yönetimi
  │
  └── public/            ← Basit HTML panel (vanilla JS)
      ├── index.html
      └── js/
          └── app.js
```

---

## Root Auth — Nasıl Çalışacak?

Root kullanıcısı veritabanında değil — `.env` dosyasında:

```env
ROOT_USERNAME=root
ROOT_PASSWORD_HASH=$2b$12$...  # bcrypt hash, elle üretilir
ROOT_SESSION_SECRET=cok_uzun_rastgele_bir_string
```

Giriş başarılı → ayrı bir JWT (ROOT_SESSION_SECRET ile imzalı) →
bu token sadece root-panel endpoint'lerinde geçerli.

```javascript
// middleware/rootAuth.js
import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';

export async function rootLogin(req, res) {
  const { username, password } = req.body;

  if (username !== process.env.ROOT_USERNAME)
    return res.status(401).json({ error: 'Geçersiz kimlik' });

  const match = await bcrypt.compare(password, process.env.ROOT_PASSWORD_HASH);
  if (!match)
    return res.status(401).json({ error: 'Geçersiz kimlik' });

  const token = jwt.sign(
    { root: true, iat: Date.now() },
    process.env.ROOT_SESSION_SECRET,
    { expiresIn: '2h' }   // Root oturumu kısa tutulur
  );

  res.cookie('root_token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ success: true });
}

export function requireRoot(req, res, next) {
  const token = req.cookies.root_token;
  if (!token) return res.status(401).json({ error: 'Root girişi gerekli' });

  try {
    const decoded = jwt.verify(token, process.env.ROOT_SESSION_SECRET);
    if (!decoded.root) throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Root oturumu geçersiz' });
  }
}
```

---

## Impersonate (Destek Modu)

Bir müşterinin sorununu çözmek için onun admin'i gibi giriş yapabilmek:

```javascript
// routes/impersonate.js
router.post('/companies/:id/impersonate', requireRoot, async (req, res) => {
  // O şirketin admin kullanıcısını bul
  const { rows } = await db.query(
    `SELECT id, role, company_id FROM users
     WHERE company_id = $1 AND role = 'admin'
     LIMIT 1`,
    [req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Admin bulunamadı' });

  // PDKS app token'ı üret (impersonate notu ile)
  const token = jwt.sign(
    {
      id:          rows[0].id,
      role:        rows[0].role,
      company_id:  rows[0].company_id,
      impersonate: true,           // Audit log için işaret
      root_actor:  'root',
    },
    process.env.JWT_SECRET,       // pdks-app'in secret'ı
    { expiresIn: '1h' }
  );

  // Audit log'a yaz
  await db.query(
    `INSERT INTO audit_log (actor_id, actor_name, action, target_table, target_id)
     VALUES ($1, 'ROOT', 'impersonate', 'companies', $2)`,
    [rows[0].id, req.params.id]
  );

  res.json({ token }); // Root panel bu token'ı kopyalar, pdks-app'e gider
});
```

---

## Güvenlik Notları

- Root panel hiçbir zaman public IP'ye bağlanmamalı
- Her root girişi audit_log'a düşmeli
- Impersonate işlemi her zaman loglanmalı
- Root session süresi kısa tutulmalı (2 saat)
- 2FA eklenirse Cloudflare Access en kolay yol
- Root şifresi en az 20 karakter, rastgele üretilmeli:
  ```bash
  openssl rand -base64 32
  ```

---

## Geliştirme Sırası (İleriye Dönük Not)

```
1. PDKS uygulaması tamamlandıktan sonra başla
2. shared/db/connection.js ortak bağlantıya taşı
3. server.js iskelet (port 4000, IP kısıtı)
4. rootAuth.js + login sayfası
5. companies CRUD
6. stats dashboard
7. impersonate
8. system tools (migration, cache, queue)
9. feature flags
```

---

## Bağlantılı Dosyalar

- [MIMARI.md](MIMARI.md) — Ana PDKS uygulaması mimarisi
- [DEGERLENDIRME.md](DEGERLENDIRME.md) — Sistem değerlendirmesi

---

*Not tarihi: 2026-06-01 — Geliştirme PDKS tamamlandıktan sonra*
