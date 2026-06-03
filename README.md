# PDKS — Personel Devam Kontrol Sistemi

QR kod + IP doğrulamalı personel giriş/çıkış takip sistemi.

**Stack:** Node.js · Express · TypeScript · PostgreSQL · Alpine.js · PWA

---

## Gereksinimler

| Yazılım | Minimum Sürüm | İndir |
|---------|--------------|-------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 15.x | [postgresql.org](https://postgresql.org) |
| npm | 9.x | Node.js ile gelir |

---

## Kurulum

### 1. Repoyu klonla

```bash
git clone https://github.com/KULLANICI/pdks.git
cd pdks
npm install
```

### 2. PostgreSQL kurulumu

**Windows:**
1. [postgresql.org/download](https://www.postgresql.org/download/windows/) → installer indir
2. Kurulum sırasında `postgres` kullanıcısı için şifre belirle (ya da boş bırak)
3. Servisi başlat: Başlat Menüsü → "pgAdmin" veya "Services" → PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Veritabanı oluştur

```bash
# postgres kullanıcısıyla bağlan
psql -U postgres

# Veritabanı oluştur
CREATE DATABASE pdks;

# Çık
\q
```

### 4. .env dosyasını oluştur

`.env.example` dosyasını kopyala:

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
PORT=3005
NODE_ENV=development
APP_URL=http://localhost:3005

# PostgreSQL bağlantısı
# Şifre yoksa: postgresql://postgres:@localhost:5432/pdks
# Şifre varsa:  postgresql://postgres:SIFREN@localhost:5432/pdks
DATABASE_URL=postgresql://postgres:@localhost:5432/pdks

# JWT — en az 64 karakter rastgele string üret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=BURAYA_UZUN_RASTGELE_STRING_YAZ

# Push bildirimleri — opsiyonel (boş bırakılabilir)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@sirketiniz.com
```

### 5. Migrasyonları çalıştır (tabloları oluşturur)

```bash
npm run migrate
```

Çıktı şöyle olmalı:
```
✓ 001_companies.sql
✓ 002_initial_schema.sql
Tüm migrasyonlar tamamlandı.
```

### 6. İlk veriyi yükle (seed)

```bash
npm run seed
```

Bu komut:
- `PDKS Test A.Ş.` şirketini oluşturur
- Admin kullanıcı ekler: Personel ID `admin` / Şifre `admin123`

### 7. Frontend'i build et

```bash
npx tsx build.ts
```

`public/js/` klasörü oluşur.

### 8. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıda aç: [http://localhost:3005](http://localhost:3005)

---

## Push Bildirimleri (Opsiyonel)

Push bildirimleri için VAPID anahtarı gerekir:

```bash
# Anahtar üret
node -e "const w=require('web-push'); const k=w.generateVAPIDKeys(); console.log('PUBLIC:',k.publicKey,'\nPRIVATE:',k.privateKey)"
```

Çıktıyı `.env` dosyasına yapıştır.

---

## Komutlar

| Komut | Ne yapar |
|-------|---------|
| `npm run dev` | Geliştirme sunucusu (watch mod) |
| `npm run build` | Production build |
| `npm run migrate` | DB tablolarını oluştur |
| `npm run seed` | Örnek veri yükle |
| `npm test` | Testleri çalıştır |
| `npx tsx build.ts` | Frontend build |

---

## Production Kurulumu

```bash
# 1. Build al
npm run build

# 2. PM2 ile çalıştır (arka planda)
npm install -g pm2
pm2 start dist/server.js --name pdks
pm2 save
pm2 startup
```

---

## Roller

| Rol | Yetkiler |
|-----|---------|
| `admin` | Her şey |
| `mudur` | İzin onaylama, rapor, personel görüntüleme |
| `takim_lideri` | Kendi ekibinin onayları |
| `personel` | Giriş/çıkış, kendi izinleri |

---

## Sorun Giderme

**`ECONNREFUSED` hatası:**
PostgreSQL çalışmıyor. Servisi başlat.

**`relation "companies" does not exist`:**
`npm run migrate` çalıştırılmamış.

**Giriş yapılamıyor:**
`npm run seed` ile test kullanıcıları oluşturulmuş mu kontrol et.

**Push bildirimi gelmiyor:**
`.env`'de `VAPID_*` anahtarları tanımlı mı kontrol et. Profil sayfasından "Bildirimleri Etkinleştir" bas.
