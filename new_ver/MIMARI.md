# PDKS — Yeni Mimari Planı (Revize)

**Stack: Node.js + Express + Vanilla JS + PWA + PostgreSQL**  
**Mimari: Class tabanlı, 3 katman, modül eklemeye hazır**

---

## Class Bazlı Mimari Neden?

Fonksiyon tabanlı:
```javascript
// Her repository dosyasında aynı findById, create, update... tekrar tekrar
export async function findById(id) { ... }
export async function create(data) { ... }
export async function softDelete(id) { ... }
```

Class tabanlı:
```javascript
// Bir kez yaz, hep kullan
class BaseRepository {
  async findById(id) { ... }
  async create(data) { ... }
  async softDelete(id) { ... }
}
class AttendanceRepository extends BaseRepository {
  // Sadece attendance'a özgü sorgular buraya
}
```

**Sonuç:** 9 repository × 4 ortak metod = 36 tekrar yerine 4 metod.

---

## Class Bazlı Yüzde Hedefi

| Katman | Şu An (Önceki Plan) | Yeni Hedef |
|--------|---------------------|------------|
| Backend Repository | %0 | %90 |
| Backend Service | %0 | %80 |
| Frontend Sayfalar | %0 | %90 |
| Frontend Bileşenler | %0 | %95 |
| Router / State / API | %0 | %85 |
| **Genel** | **%0** | **~%85** |

---

## MySQL mi, PostgreSQL mi?

### MySQL
```
+ Kurulumu kolay
+ Paylaşımlı hosting'lerde standart
- JSON desteği zayıf
- Veri bütünlüğü varsayılan olarak gevşek
```

### PostgreSQL
```
+ JSONB: push_subscription için indexlenebilir JSON
+ RETURNING: INSERT sonrası ekstra sorgu yok
+ Veri bütünlüğü sıkı
+ Tamamen açık kaynak
```

**Tavsiye: PostgreSQL** — Coolify ile kurulumu otomatik.  
MySQL farkları doküman sonunda tablo halinde.

---

## Coolify ile PostgreSQL

```
1. Coolify → Databases → New Database → PostgreSQL 16
2. Otomatik üretilen bağlantı string'i kopyala
3. Uygulamanın Environment Variables bölümüne yapıştır:
   DATABASE_URL=postgresql://user:pass@hostname:5432/pdks
4. Kod içinde: new pg.Pool({ connectionString: process.env.DATABASE_URL })
```

**Kritik:** PostgreSQL ve Node.js aynı Coolify sunucusundaysa adres
`localhost` değil Docker iç ağı olur — Coolify bunu otomatik ayarlar,
connection string'i olduğu gibi kullanırsın.

**Kritik:** Yüklenen dosyalar (`uploads/`) Docker volume'e bağlanmalı,
yoksa container yeniden başlayınca kaybolur.
Coolify panelinde uygulama ayarları → Volumes → `/app/uploads` ekle.

MySQL için aynı adımlar, `pg` yerine `mysql2` paketi.

---

## Klasör Yapısı

```
pdks/
│
├── server.js                    ← Express başlatma + route bağlama + hata handler
├── package.json
├── .env
├── .env.example
├── .gitignore
│
├── db/
│   ├── connection.js            ← pg.Pool singleton
│   ├── schema.sql               ← Tüm CREATE TABLE
│   └── seed.sql                 ← İlk admin kaydı
│
├── core/                        ← Temel class'lar — burası değişmez
│   ├── BaseRepository.js        ← CRUD metodları
│   ├── BaseService.js           ← Ortak servis yardımcıları
│   └── AppError.js              ← Standart hata class'ı
│
├── repositories/                ← BaseRepository'yi extend eder
│   ├── UserRepository.js
│   ├── AttendanceRepository.js
│   ├── LeaveRepository.js
│   ├── OvertimeRepository.js
│   ├── NotificationRepository.js
│   ├── SettingsRepository.js
│   └── HolidayRepository.js
│
├── services/                    ← İş mantığı — DB ve HTTP bilmez
│   ├── AuthService.js
│   ├── UserService.js
│   ├── AttendanceService.js
│   ├── LeaveService.js
│   ├── OvertimeService.js
│   ├── NotificationService.js
│   └── ExcelService.js
│
├── routes/                      ← Sadece HTTP: istek → service → cevap
│   ├── auth.js
│   ├── users.js
│   ├── attendance.js
│   ├── leaves.js
│   ├── overtime.js
│   ├── notifications.js
│   ├── settings.js
│   ├── push.js
│   └── holidays.js
│
├── middleware/
│   ├── auth.js                  ← JWT cookie doğrulama
│   ├── roles.js                 ← Rol kontrolü
│   └── rateLimit.js             ← Login brute-force koruması
│
├── events/
│   └── emitter.js               ← EventEmitter singleton
│
├── uploads/                     ← Docker volume'e bağlanır (git'e girmiyor)
│
└── public/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── logo192.png
    ├── logo512.png
    │
    ├── css/
    │   ├── style.css
    │   └── components.css
    │
    └── js/
        │
        ├── core/                ← Temel class'lar — burası değişmez
        │   ├── BasePage.js      ← Tüm sayfaların atası
        │   ├── BaseComponent.js ← Tüm bileşenlerin atası
        │   ├── Router.js        ← Sayfa yönlendirme
        │   ├── ApiClient.js     ← Fetch wrapper
        │   ├── StateManager.js  ← Global state
        │   └── EventBus.js      ← Frontend olay sistemi
        │
        ├── components/          ← BaseComponent'i extend eder
        │   ├── Modal.js
        │   ├── Toast.js
        │   ├── BottomNav.js
        │   ├── QRScanner.js
        │   └── Confirm.js
        │
        ├── pages/               ← BasePage'i extend eder
        │   ├── LoginPage.js
        │   ├── HomePage.js
        │   ├── LeavesPage.js
        │   ├── OvertimePage.js
        │   ├── ApprovalsPage.js
        │   ├── UsersPage.js
        │   ├── MovementsPage.js
        │   ├── ProfilePage.js
        │   └── SettingsPage.js
        │
        ├── offline.js           ← IndexedDB kuyruk
        └── app.js               ← Başlangıç noktası
```

---

## BACKEND — Class Yapıları

### core/AppError.js

```javascript
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Kullanım: throw new AppError('Hatalı şifre', 401);
// throw new AppError('Yetersiz yetki', 403);
// throw new AppError('Bulunamadı', 404);
```

---

### core/BaseRepository.js

```javascript
import { db } from '../db/connection.js';
import { AppError } from './AppError.js';

export class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
    this.db = db;
  }

  async findById(id) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.table} WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return rows[0] || null;
  }

  async findAll({ where = '', params = [], orderBy = 'created_at DESC', limit = 100, offset = 0 } = {}) {
    const whereClause = where ? `WHERE ${where} AND is_deleted = false` : 'WHERE is_deleted = false';
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.table}
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return rows;
  }

  async create(data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const cols   = keys.join(', ');
    const phs    = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await this.db.query(
      `INSERT INTO ${this.table} (${cols}) VALUES (${phs}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id, data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const sets   = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await this.db.query(
      `UPDATE ${this.table} SET ${sets}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING *`,
      [...values, id]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }

  async softDelete(id, deletedBy = null) {
    const { rows } = await this.db.query(
      `UPDATE ${this.table}
       SET is_deleted = true, deleted_by = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, deletedBy]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }

  async count(where = '', params = []) {
    const whereClause = where
      ? `WHERE ${where} AND is_deleted = false`
      : 'WHERE is_deleted = false';
    const { rows } = await this.db.query(
      `SELECT COUNT(*) FROM ${this.table} ${whereClause}`,
      params
    );
    return parseInt(rows[0].count);
  }
}
```

---

### repositories/AttendanceRepository.js

```javascript
import { BaseRepository } from '../core/BaseRepository.js';

export class AttendanceRepository extends BaseRepository {
  constructor() { super('attendance'); }

  async findByUser(userId, { month, limit = 200 } = {}) {
    const { rows } = await this.db.query(
      `SELECT * FROM attendance
       WHERE user_id = $1
         AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', $2::date)
         AND is_deleted = false
       ORDER BY timestamp DESC
       LIMIT $3`,
      [userId, month || new Date(), limit]
    );
    return rows;
  }

  async findToday({ adminId = null, managerId = null } = {}) {
    let q = `SELECT a.*, u.name as user_name
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE DATE(a.timestamp) = CURRENT_DATE
               AND a.is_deleted = false`;
    const params = [];

    if (managerId) {
      params.push(managerId);
      q += ` AND u.manager_id = $${params.length}`;
    }

    q += ' ORDER BY a.timestamp DESC';
    const { rows } = await this.db.query(q, params);
    return rows;
  }

  async findPage({ userId, managerId, page = 1, limit = 50, month } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ['a.is_deleted = false'];

    if (userId)    { params.push(userId);    conditions.push(`a.user_id = $${params.length}`); }
    if (managerId) { params.push(managerId); conditions.push(`u.manager_id = $${params.length}`); }
    if (month)     { params.push(month);     conditions.push(`DATE_TRUNC('month', a.timestamp) = DATE_TRUNC('month', $${params.length}::date)`); }

    const where = conditions.join(' AND ');
    params.push(limit, offset);

    const { rows } = await this.db.query(
      `SELECT a.* FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE ${where}
       ORDER BY a.timestamp DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  }
}
```

---

### repositories/UserRepository.js

```javascript
import { BaseRepository } from '../core/BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor() { super('users'); }

  async findByPersonnelId(personnelId) {
    const { rows } = await this.db.query(
      `SELECT * FROM users WHERE personnel_id = $1 AND role != 'deleted'`,
      [personnelId]
    );
    return rows[0] || null;
  }

  async findByManager(managerId) {
    return this.findAll({ where: 'manager_id = $1', params: [managerId] });
  }

  async findActive() {
    return this.findAll({ where: "role != 'deleted'" });
  }
}
```

---

### core/BaseService.js

```javascript
import { AppError } from './AppError.js';

export class BaseService {
  // Alt sınıflar için ortak yardımcılar

  assertAdmin(user) {
    if (user.role !== 'admin')
      throw new AppError('Bu işlem için admin yetkisi gerekli', 403);
  }

  assertManagerOf(actor, targetManagerId) {
    if (actor.role !== 'admin' && actor.id !== targetManagerId)
      throw new AppError('Bu personelin yöneticisi değilsiniz', 403);
  }

  assertSelfOrAdmin(actor, targetId) {
    if (actor.role !== 'admin' && actor.id !== targetId)
      throw new AppError('Sadece kendi bilgilerinizi düzenleyebilirsiniz', 403);
  }

  paginate(page = 1, limit = 50) {
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    return { page: p, limit: l, offset: (p - 1) * l };
  }
}
```

---

### services/AttendanceService.js

```javascript
import { BaseService } from '../core/BaseService.js';
import { AppError }    from '../core/AppError.js';
import { emitter }     from '../events/emitter.js';

export class AttendanceService extends BaseService {
  constructor(attendanceRepo, settingsRepo) {
    super();
    this.attendanceRepo = attendanceRepo;
    this.settingsRepo   = settingsRepo;
  }

  async checkIn({ userId, userName, type, ip, location, isOffline = false }) {
    const settings = await this.settingsRepo.get();

    // IP kontrolü
    if (settings.office_ip && ip !== settings.office_ip) {
      // Uzaktan yetkisi olmayan biri → hata kaydı yaz
      await this.attendanceRepo.create({
        user_id: userId, user_name: userName, type, ip_address: ip,
        status: 'error', error_message: 'Hatalı ağ'
      });
      throw new AppError('Sadece iş yeri ağından giriş yapılabilir', 403);
    }

    const log = await this.attendanceRepo.create({
      user_id:       userId,
      user_name:     userName,
      type,
      ip_address:    ip,
      latitude:      location?.lat  || null,
      longitude:     location?.lng  || null,
      status:        'success',
      offline_queued: isOffline,
    });

    // Push bildirimini servis bilmez — olay fırlatır
    emitter.emit('attendance:checkin', { userId, userName, type });

    return log;
  }

  async getPage(user, query) {
    const { page, limit } = this.paginate(query.page, query.limit);
    const isAdmin = user.role === 'admin';

    return this.attendanceRepo.findPage({
      userId:    isAdmin ? null : user.id,
      managerId: isAdmin ? null : user.id,
      page, limit,
      month: query.month,
    });
  }
}
```

---

### services/AuthService.js

```javascript
import jwt      from 'jsonwebtoken';
import bcrypt   from 'bcryptjs';
import { BaseService } from '../core/BaseService.js';
import { AppError }    from '../core/AppError.js';

export class AuthService extends BaseService {
  constructor(userRepo) {
    super();
    this.userRepo = userRepo;
  }

  async login({ personnelId, password, deviceId, userAgent }) {
    const user = await this.userRepo.findByPersonnelId(personnelId);
    if (!user) throw new AppError('Hatalı ID veya şifre', 401);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Hatalı ID veya şifre', 401);

    if (user.role === 'deleted') throw new AppError('Hesap pasif', 403);

    // Cihaz kontrolü
    if (user.role === 'personel' && user.device_id && user.device_id !== deviceId)
      throw new AppError('Bu hesap farklı bir cihaza tanımlı', 403);

    // İlk girişte cihazı kaydet
    if (user.role === 'personel' && !user.device_id && deviceId)
      await this.userRepo.update(user.id, { device_id: deviceId });

    // Token — HTTP response'a dokunmuyor (route halleder)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password_hash, ...profile } = user;
    return { token, profile };
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await this.userRepo.findById(userId);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) throw new AppError('Mevcut şifre hatalı', 401);

    const hash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password_hash: hash });
  }
}
```

---

### routes/auth.js — Service'e delege, cookie burada ayarlanır

```javascript
import { Router }      from 'express';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { requireAuth } from '../middleware/auth.js';

const router  = Router();
const service = new AuthService(new UserRepository());

router.post('/login', async (req, res, next) => {
  try {
    const { token, profile } = await service.login({
      personnelId: req.body.personnelId,
      password:    req.body.password,
      deviceId:    req.body.deviceId,
      userAgent:   req.headers['user-agent'],
    });

    // Cookie burada — service HTTP bilmez
    res.cookie('pdks_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   8 * 60 * 60 * 1000,
    });

    res.json({ success: true, profile });
  } catch (err) {
    next(err); // Global handler'a gider
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('pdks_token');
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const repo = new UserRepository();
    const user = await repo.findById(req.user.id);
    const { password_hash, ...profile } = user;
    res.json(profile);
  } catch (err) { next(err); }
});

export default router;
```

---

### db/connection.js — Singleton pool

```javascript
import pg     from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max:            10,   // Maksimum bağlantı
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Beklenmedik DB hatası:', err);
});

export const db = pool;
```

---

### server.js — Tek dosya, temiz

```javascript
import express      from 'express';
import helmet       from 'helmet';
import cors         from 'cors';
import cookieParser from 'cookie-parser';
import path         from 'path';
import { fileURLToPath } from 'url';
import dotenv       from 'dotenv';
dotenv.config();

// Routes
import authRoute          from './routes/auth.js';
import usersRoute         from './routes/users.js';
import attendanceRoute    from './routes/attendance.js';
import leavesRoute        from './routes/leaves.js';
import overtimeRoute      from './routes/overtime.js';
import notificationsRoute from './routes/notifications.js';
import settingsRoute      from './routes/settings.js';
import pushRoute          from './routes/push.js';
import holidaysRoute      from './routes/holidays.js';

// Events
import './events/setup.js';  // Tüm event dinleyicileri tek yerde kurulur

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Güvenlik
app.use(helmet());
app.use(cors({ origin: process.env.APP_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth',          authRoute);
app.use('/api/users',         usersRoute);
app.use('/api/attendance',    attendanceRoute);
app.use('/api/leaves',        leavesRoute);
app.use('/api/overtime',      overtimeRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/settings',      settingsRoute);
app.use('/api/push',          pushRoute);
app.use('/api/holidays',      holidaysRoute);

// SPA catch-all — /leaves gibi sayfalarda F5 yapılınca 404 vermemesi için
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global hata handler — tüm next(err) buraya düşer
app.use((err, req, res, next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Sunucu hatası';
  if (status === 500) console.error('[ERROR]', err);
  res.status(status).json({ error: message });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`PDKS çalışıyor → http://localhost:${process.env.PORT || 3000}`);
});
```

---

### events/setup.js — Tüm event bağlamaları tek yerde

```javascript
import { emitter }              from './emitter.js';
import { NotificationService }  from '../services/NotificationService.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { UserRepository }       from '../repositories/UserRepository.js';

const notifService = new NotificationService(
  new NotificationRepository(),
  new UserRepository()
);

emitter.on('attendance:checkin',  (data) => notifService.onCheckin(data));
emitter.on('leave:requested',     (data) => notifService.onLeaveRequest(data));
emitter.on('leave:approved',      (data) => notifService.onLeaveApproved(data));
emitter.on('leave:rejected',      (data) => notifService.onLeaveRejected(data));
emitter.on('overtime:requested',  (data) => notifService.onOvertimeRequest(data));
```

---

## Alpine.js — Vanilla JS ile Reaktivite

### Neden Alpine.js?

Vanilla JS büyüyünce DOM yönetimi zorlaşır.
React/Preact şart değil — Alpine.js yeterli.

```
Alpine.js:
  - 15 KB (React = 40 KB, Preact = 3 KB)
  - Sıfır build adımı — script tag'i ile yükle
  - HTML attribute'larıyla reaktivite
  - Mevcut class mimarisiyle tam uyumlu
  - Öğrenmesi çok kolay
```

**Bu projenin kaçta kaçı Alpine.js gerektirir?**

| Ekran | Karmaşıklık | Çözüm |
|-------|-------------|-------|
| Login | Basit | Vanilla JS yeter |
| Profil | Basit | Vanilla JS yeter |
| İzin talebi formu | Basit | Vanilla JS yeter |
| Home (giriş/çıkış) | Orta | Alpine.js güzel olur |
| Onaylar listesi | Orta | Alpine.js güzel olur |
| Hareketler (filtre+tablo) | Karmaşık | Alpine.js gerekli |
| Admin dashboard | Karmaşık | Alpine.js gerekli |
| Kullanıcı yönetimi | Karmaşık | Alpine.js gerekli |

**Sonuç:** %70 Vanilla JS, %30 Alpine.js. React'e gerek yok.

### Class Mimarisiyle Uyum

Alpine.js ve class mimarisi çatışmaz — birbirini tamamlar.

```
BasePage.render() → HTML yaz → Alpine yakalar → reaktivite sağlar
class metodu       → iş mantığı → Alpine.js'e veri sağlar
```

```typescript
// Alpine.data() ile class metodlarını bağla
// public/ts/pages/HomePage.ts

Alpine.data('homePage', () => {
  return {
    logs:    [] as AttendanceLog[],
    loading: false,
    profile: state.get('profile') as UserProfile,

    async init() {
      this.logs = await api.get('/api/v1/attendance?today=true');
    },

    async checkIn(type: 'in' | 'out') {
      this.loading = true;
      try {
        await api.post('/api/v1/attendance', { type });
        Toast.show(type === 'in' ? 'Giriş kaydedildi' : 'Çıkış kaydedildi');
        await this.init();
      } catch (err: any) {
        Toast.show(err.message, 'error');
      } finally {
        this.loading = false;
      }
    },
  };
});
```

```html
<!-- pages/home.html snippet — Alpine attribute'ları -->
<div x-data="homePage" x-init="init()">

  <div x-show="loading" class="spinner">Yükleniyor...</div>

  <div class="check-buttons">
    <button @click="checkIn('in')"  :disabled="loading">Giriş Yap</button>
    <button @click="checkIn('out')" :disabled="loading">Çıkış Yap</button>
  </div>

  <ul class="log-list">
    <template x-for="log in logs" :key="log.id">
      <li class="log-item" :class="log.type">
        <span x-text="log.type === 'in' ? 'Giriş' : 'Çıkış'"></span>
        <span x-text="new Date(log.timestamp).toLocaleTimeString('tr-TR')"></span>
      </li>
    </template>
    <li x-show="logs.length === 0" class="empty">Bugün hareket yok</li>
  </ul>
</div>
```

### Alpine.js Kurulumu

```html
<!-- public/index.html — CDN, build adımı yok -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
```

Ya da npm ile (esbuild'e dahil olur):
```bash
npm install alpinejs
```

```typescript
// public/ts/app.ts
import Alpine from 'alpinejs';

// Tüm Alpine bileşenlerini kaydet
import './pages/HomePage.js';
import './pages/ApprovalsPage.js';
import './pages/MovementsPage.js';

Alpine.start();
```

### Modülerlik ve Parça Ekleyip Çıkarma

Alpine.js class mimarisiyle birlikte kullanılınca modülerlik tam korunur.

**Yeni sayfa eklemek:**
```typescript
// 1. Yeni Alpine bileşeni yaz
Alpine.data('shiftsPage', () => ({ ... }));

// 2. Router'a ekle — 1 satır
routes['/shifts'] = 'shifts';

// 3. HTML dosyasını yaz
// 4. Backend route + service + repository ekle
```

**Parça çıkarmak:**
```typescript
// Alpine bileşenini sil
// Router'dan kaldır — 1 satır
// Backend route'u kaldır
// Başka hiçbir şeye dokunma
```

**Gelecekte sorun yaratır mı?**
Alpine.js 2019'dan beri stabil, Tailwind ekibinin projesi, aktif geliştirme.
Vanilla JS + Alpine.js kombinasyonu 5-10 yıl sorunsuz kullanılabilir.
React/Preact geçişi gerekirse Alpine bileşenleri birer birer taşınabilir — hepsini aynı anda değiştirmek zorunda değilsin.

---

## FRONTEND — Class Yapıları

### js/core/BasePage.js

```javascript
export class BasePage {
  constructor(container) {
    this.container = container;
    this._listeners = [];
  }

  // Alt sınıf override eder
  async render() {
    throw new Error(`${this.constructor.name}.render() uygulanmamış`);
  }

  // Event ekle ve otomatik temizlik için kaydet
  on(selector, event, handler) {
    const el = typeof selector === 'string'
      ? this.container.querySelector(selector)
      : selector;
    if (!el) return;
    el.addEventListener(event, handler);
    this._listeners.push({ el, event, handler });
    return this;
  }

  // $ : container içinde querySelector kısayolu
  $(selector) { return this.container.querySelector(selector); }
  $$(selector) { return this.container.querySelectorAll(selector); }

  // Sayfa değişince eski listener'ları temizle
  destroy() {
    this._listeners.forEach(({ el, event, handler }) =>
      el.removeEventListener(event, handler)
    );
    this._listeners = [];
  }
}
```

---

### js/core/BaseComponent.js

```javascript
export class BaseComponent {
  constructor(props = {}) {
    this.props = props;
    this.el    = null;
  }

  // Alt sınıf HTML string döndürür
  template() {
    throw new Error(`${this.constructor.name}.template() uygulanmamış`);
  }

  // Olayları bağlamak için override edilir
  afterMount() {}

  mount(container) {
    this.el = document.createElement('div');
    this.el.innerHTML = this.template();
    const child = this.el.firstElementChild;
    container.appendChild(child);
    this.el = child;
    this.afterMount();
    return this;
  }

  unmount() {
    this.el?.remove();
    this.el = null;
  }

  $(sel) { return this.el?.querySelector(sel); }
}
```

---

### js/core/Router.js

```javascript
import { state } from './StateManager.js';

export class Router {
  constructor(routes, appContainer) {
    this.routes    = routes;
    this.container = appContainer;
    this.current   = null;

    window.addEventListener('popstate', () => this._render(location.pathname));
  }

  async navigate(path) {
    history.pushState(null, '', path);
    await this._render(path);
  }

  async _render(path) {
    // Oturum yoksa login'e yönlendir
    if (!state.get('user') && path !== '/login') {
      return this.navigate('/login');
    }

    const loader = this.routes[path] || this.routes['/home'];
    const { default: PageClass } = await loader();

    // Eski sayfayı temizle
    this.current?.destroy();

    this.current = new PageClass(this.container);
    await this.current.render();
  }
}
```

---

### js/core/StateManager.js

```javascript
class StateManager {
  constructor() {
    this._state = {
      user:     null,
      profile:  null,
      settings: null,
      isOnline: navigator.onLine,
    };
    this._watchers = {};
  }

  get(key) { return this._state[key]; }

  set(key, value) {
    this._state[key] = value;
    this._watchers[key]?.forEach(fn => fn(value));
  }

  watch(key, fn) {
    (this._watchers[key] ??= []).push(fn);
    return () => {  // Unsubscribe fonksiyonu döner
      this._watchers[key] = this._watchers[key].filter(f => f !== fn);
    };
  }
}

export const state = new StateManager();
```

---

### js/core/ApiClient.js

```javascript
import { Router } from './Router.js';

class ApiClient {
  async _request(method, url, body, isForm = false) {
    const opts = {
      method,
      credentials: 'include',
    };

    if (body) {
      if (isForm) {
        opts.body = body; // FormData — header set edilmez
      } else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body    = JSON.stringify(body);
      }
    }

    const res  = await fetch(url, opts);
    const data = await res.json();

    if (res.status === 401) {
      window.router?.navigate('/login');
      return null;
    }

    if (!res.ok) throw new Error(data.error || 'Sunucu hatası');

    return data;
  }

  get(url)              { return this._request('GET',    url); }
  post(url, body)       { return this._request('POST',   url, body); }
  put(url, body)        { return this._request('PUT',    url, body); }
  delete(url)           { return this._request('DELETE', url); }
  upload(url, formData) { return this._request('POST',   url, formData, true); }
}

export const api = new ApiClient();
```

---

### js/core/EventBus.js

```javascript
class EventBus {
  constructor() { this._listeners = {}; }

  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this._listeners[event] = this._listeners[event]?.filter(f => f !== fn);
  }

  emit(event, data) {
    this._listeners[event]?.forEach(fn => fn(data));
  }
}

export const bus = new EventBus();
```

---

### js/components/Toast.js

```javascript
import { BaseComponent } from '../core/BaseComponent.js';

export class Toast extends BaseComponent {
  template() {
    return `<div class="toast toast-${this.props.type || 'success'}">
      ${this.props.message}
    </div>`;
  }

  afterMount() {
    setTimeout(() => this.unmount(), this.props.duration || 3000);
  }

  static show(message, type = 'success', duration = 3000) {
    const t = new Toast({ message, type, duration });
    t.mount(document.body);
  }
}
```

---

### js/components/Modal.js

```javascript
import { BaseComponent } from '../core/BaseComponent.js';

export class Modal extends BaseComponent {
  template() {
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h3>${this.props.title}</h3>
          <div class="modal-body">${this.props.content}</div>
          <div class="modal-actions">
            <button class="btn-cancel">İptal</button>
            <button class="btn-confirm">${this.props.confirmText || 'Onayla'}</button>
          </div>
        </div>
      </div>`;
  }

  afterMount() {
    this.$('.btn-confirm').onclick = () => {
      this.props.onConfirm?.();
      this.unmount();
    };
    this.$('.btn-cancel').onclick = () => {
      this.props.onCancel?.();
      this.unmount();
    };
    // Overlay'e tıklayınca kapat
    this.el.onclick = (e) => {
      if (e.target === this.el) this.unmount();
    };
  }
}
```

---

### js/pages/HomePage.js

```javascript
import { BasePage }  from '../core/BasePage.js';
import { api }       from '../core/ApiClient.js';
import { state }     from '../core/StateManager.js';
import { Toast }     from '../components/Toast.js';
import { Modal }     from '../components/Modal.js';

export default class HomePage extends BasePage {
  async render() {
    const { logs } = await api.get('/api/attendance?today=true');
    const profile  = state.get('profile');

    this.container.innerHTML = `
      <div class="page-home">
        <div class="greeting">Merhaba, ${profile.name}</div>
        <p class="role-badge">${profile.title || profile.role}</p>

        <div class="check-buttons">
          <button id="btn-in"  class="btn-primary">Giriş Yap</button>
          <button id="btn-out" class="btn-secondary">Çıkış Yap</button>
        </div>

        <ul class="log-list">
          ${logs.map(l => this._logItem(l)).join('') || '<li class="empty">Bugün hareket yok</li>'}
        </ul>
      </div>
    `;

    this.on('#btn-in',  'click', () => this._checkIn('in'));
    this.on('#btn-out', 'click', () => this._checkIn('out'));
  }

  _logItem(log) {
    const time  = new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const label = log.type === 'in' ? 'Giriş' : 'Çıkış';
    return `<li class="log-item log-${log.type}">${label} — ${time}</li>`;
  }

  async _checkIn(type) {
    try {
      await api.post('/api/attendance', { type });
      Toast.show(`${type === 'in' ? 'Giriş' : 'Çıkış'} kaydedildi.`);
      await this.render(); // Sayfayı yenile
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
}
```

---

### js/app.js — Başlangıç noktası

```javascript
import { Router }  from './core/Router.js';
import { state }   from './core/StateManager.js';
import { api }     from './core/ApiClient.js';
import { BottomNav } from './components/BottomNav.js';

// Tüm sayfalar lazy load — ihtiyaç olunca indirilir
const routes = {
  '/login':     () => import('./pages/LoginPage.js'),
  '/home':      () => import('./pages/HomePage.js'),
  '/leaves':    () => import('./pages/LeavesPage.js'),
  '/overtime':  () => import('./pages/OvertimePage.js'),
  '/approvals': () => import('./pages/ApprovalsPage.js'),
  '/users':     () => import('./pages/UsersPage.js'),
  '/movements': () => import('./pages/MovementsPage.js'),
  '/profile':   () => import('./pages/ProfilePage.js'),
  '/settings':  () => import('./pages/SettingsPage.js'),
};

async function init() {
  // Oturum kontrolü
  const profile = await api.get('/api/auth/me').catch(() => null);
  if (profile) {
    state.set('user', { id: profile.id, role: profile.role });
    state.set('profile', profile);
  }

  const app    = document.getElementById('app');
  const navEl  = document.getElementById('bottom-nav');

  window.router = new Router(routes, app);

  // Nav sadece giriş yapılmışsa görünür
  state.watch('user', (user) => {
    if (user) new BottomNav({ profile: state.get('profile') }).mount(navEl);
    else navEl.innerHTML = '';
  });

  // Service Worker kayıt
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  // İlk yükleme
  await window.router._render(location.pathname);
}

init();
```

---

## PWA

### public/manifest.json

```json
{
  "name": "PDKS Uygulaması",
  "short_name": "PDKS",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#09090b",
  "background_color": "#09090b",
  "icons": [
    { "src": "/logo192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### public/sw.js — Cache versiyonu yönetimiyle

```javascript
// DEPLOY'DA BU VERSİYONU ARTIR → eski cache temizlenir
const VERSION = 'pdks-v1';
const STATIC  = ['/', '/css/style.css', '/js/app.js',
                  '/js/core/Router.js', '/js/core/ApiClient.js',
                  '/logo192.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting()) // Hemen aktif ol
  );
});

self.addEventListener('activate', e => {
  // Eski cache versiyonlarını sil
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // API cache'lenmez
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push bildirimi
self.addEventListener('push', e => {
  if (!e.data) return;
  const { title, body, link = '/' } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body, icon: '/logo192.png',
      data: { link },
      actions: [{ action: 'open', title: 'Görüntüle' }],
      tag: link,        // Aynı sayfaya ait bildirimleri grupla
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = e.notification.data?.link || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const open = list.find(c => c.url.includes(self.location.origin));
      if (open) { open.focus(); open.postMessage({ type: 'NAVIGATE', link }); }
      else clients.openWindow(self.location.origin + link);
    })
  );
});
```

---

## Veritabanı — Tasarım Kararları ve İlişkiler

### Varlık İlişki Diyagramı

```
users ──────────────────────────────────────────────────────┐
  │  id, personnel_id, role, manager_id(self-ref)           │
  │                                                          │
  ├──< attendance          (user_id FK)                      │
  │      id, type, timestamp, ip, status                     │
  │                                                          │
  ├──< leave_requests      (user_id FK, manager_id FK)       │
  │      id, start_date, end_date, days, type, status        │
  │                                                          │
  ├──< overtime_requests   (user_id FK, manager_id FK)       │
  │      id, date, hours, status                             │
  │                                                          │
  └──< notifications       (user_id FK)                      │
         id, title, type, is_read                            │
                                                             │
settings ────────── tek satır tablo (id=1 sabit)            │
break_rules ──────── settings'e bağlı mola kuralları        │
holidays ─────────── yıllık tatil günleri                   │
audit_log ──────────────────────────────────────────────────┘
  actor_id FK → users, hedef tablo + kayıt ID
```

### Önemli Tasarım Kararları

**UUID primary key:**
Sıralı integer yerine UUID seçildi. Saldırgan `id=1,2,3` tahmin edemez.
`gen_random_uuid()` PostgreSQL yerleşik — ekstra paket gerekmez.

**`user_name` denormalizasyonu:**
`attendance`, `leave_requests`, `overtime_requests` tablolarında `user_name`
alanı saklanıyor. Kullanıcı adı değişse bile geçmiş kayıtlar o anki ismi tutar.
Muhasebe ve yasal kayıt için bu kasıtlı bir karar.

**Soft delete + `deleted_at`:**
Kayıtlar fiziksel silinmiyor. `is_deleted = true` + `deleted_at` timestamp ile işaretleniyor.
`deleted_at` olmadan "ne zaman silindiği" bilinemez — her tabloya eklendi.

**`updated_at` otomatik trigger:**
`updated_at` sütunu elle set edilirse unutulabilir.
PostgreSQL trigger ile otomatik güncelleniyor (aşağıda).

**Kendi kendine referans (self-referencing FK):**
`users.manager_id → users.id` — hiyerarşik yapı tek tabloda.
`ON DELETE SET NULL` ile yönetici silinince alt personel manager_id'si NULL olur.

**Partial index:**
`notifications` için `WHERE is_read = false` partial index —
okunmuş bildirimleri index dışında bırakır, sorgu hızlanır.

**`settings` tek satır tablo:**
`CONSTRAINT single_row CHECK (id = 1)` ile sadece 1 satır olabilir.
`INSERT ... ON CONFLICT DO UPDATE` pattern ile upsert kullanılır.

**`break_rules` ayrı tablo:**
Mola kuralları ayarlara bağlı ama ayrı tablo — n adet kural eklenebilir.
Array veya JSON'a koymak yerine normalize edildi, sorgulanabilir.

---

### `updated_at` Otomatik Trigger

```sql
-- Bir kez tanımla, tüm tablolarda kullan
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Her tablo için bir satır yeterli
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leaves_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_overtime_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### audit_log — Kim Ne Yaptı?

Mevcut projede eksik, yeni mimaride var.

```sql
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL REFERENCES users(id),
  actor_name   VARCHAR(100) NOT NULL,
  action       VARCHAR(50)  NOT NULL,
  -- 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login'
  target_table VARCHAR(50),
  target_id    UUID,
  old_value    JSONB,        -- Değişmeden önceki veri
  new_value    JSONB,        -- Değişen veri
  ip_address   VARCHAR(100),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor  ON audit_log(actor_id);
CREATE INDEX idx_audit_target ON audit_log(target_table, target_id);
CREATE INDEX idx_audit_time   ON audit_log(created_at DESC);
```

Service katmanında kullanımı:

```javascript
// core/BaseService.js içinde
async audit(actor, action, targetTable, targetId, oldValue, newValue) {
  await this.auditRepo.create({
    actor_id:     actor.id,
    actor_name:   actor.name,
    action,
    target_table: targetTable,
    target_id:    targetId,
    old_value:    oldValue ? JSON.stringify(oldValue) : null,
    new_value:    newValue ? JSON.stringify(newValue) : null,
  });
}

// Kullanım örneği (AttendanceService içinde):
await this.audit(actor, 'delete', 'attendance', logId, oldLog, null);
```

---

### DB Migration Sistemi

`schema.sql` bir kez çalıştırılır. Sonra tablo değişince ne olacak?

**Basit yaklaşım — migrations/ klasörü:**

```
db/
  migrations/
    001_initial_schema.sql
    002_add_deleted_at_to_attendance.sql
    003_add_audit_log_table.sql
  migrate.js          ← Hangisi çalıştırıldı takip eder
```

```javascript
// db/migrate.js
import { db } from './connection.js';
import fs     from 'fs';
import path   from 'path';

async function migrate() {
  // Migration takip tablosu
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows: applied } = await db.query('SELECT filename FROM _migrations');
  const done = new Set(applied.map(r => r.filename));

  const files = fs.readdirSync('./db/migrations').sort();

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join('./db/migrations', file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`✓ ${file}`);
  }
}

migrate().catch(console.error);
```

`package.json`'a ekle:
```json
"scripts": {
  "migrate": "node db/migrate.js"
}
```

---

## Veritabanı Şeması

### users

```sql
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id        VARCHAR(50)  UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  name                VARCHAR(100) NOT NULL,
  title               VARCHAR(100),
  email               VARCHAR(150),
  role                VARCHAR(20)  NOT NULL DEFAULT 'personel'
                      CHECK (role IN ('admin','mudur','takim_lideri','personel','deleted')),
  manager_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  leave_balance       INT          NOT NULL DEFAULT 14,
  start_date          DATE,
  birth_date          DATE,
  allowed_device      TEXT,
  device_id           VARCHAR(100),
  push_subscription   JSONB,
  can_remote_check_in BOOLEAN DEFAULT false,
  avatar_path         VARCHAR(255),
  is_deleted          BOOLEAN DEFAULT false,
  deleted_at          TIMESTAMPTZ,             -- Ne zaman pasife alındı
  deleted_by          UUID REFERENCES users(id),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### attendance

```sql
CREATE TABLE attendance (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  user_name      VARCHAR(100) NOT NULL,
  type           VARCHAR(3)   NOT NULL CHECK (type IN ('in','out')),
  timestamp      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ip_address     VARCHAR(100),
  status         VARCHAR(10)  DEFAULT 'success'
                 CHECK (status IN ('success','error','pending')),
  error_message  TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  is_remote      BOOLEAN DEFAULT false,
  remote_note    TEXT,
  manual_entry   BOOLEAN DEFAULT false,
  offline_queued BOOLEAN DEFAULT false,
  is_deleted     BOOLEAN DEFAULT false,
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID REFERENCES users(id),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_att_user ON attendance(user_id);
CREATE INDEX idx_att_ts   ON attendance(timestamp DESC);
CREATE INDEX idx_att_date ON attendance(DATE(timestamp));
```

### leave_requests

```sql
CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  user_name       VARCHAR(100) NOT NULL,
  manager_id      UUID NOT NULL REFERENCES users(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days            INT  NOT NULL CHECK (days > 0),
  reason          TEXT NOT NULL,
  type            VARCHAR(10) NOT NULL CHECK (type IN ('annual','report','excuse')),
  attachment_path VARCHAR(255),
  status          VARCHAR(10) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  delete_reason   TEXT,
  deleted_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_user    ON leave_requests(user_id);
CREATE INDEX idx_leave_manager ON leave_requests(manager_id);
CREATE INDEX idx_leave_status  ON leave_requests(status);
```

### overtime_requests

```sql
CREATE TABLE overtime_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  user_name   VARCHAR(100) NOT NULL,
  manager_id  UUID NOT NULL REFERENCES users(id),
  date        DATE NOT NULL,
  hours       DECIMAL(4,1) NOT NULL CHECK (hours > 0),
  description TEXT,
  status      VARCHAR(10) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected')),
  is_deleted  BOOLEAN DEFAULT false,
  deleted_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications

```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(10) DEFAULT 'info'
             CHECK (type IN ('info','warning','success','error')),
  is_read    BOOLEAN DEFAULT false,
  link       VARCHAR(100),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user   ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### settings

```sql
CREATE TABLE settings (
  id                         INT PRIMARY KEY DEFAULT 1,
  office_ip                  VARCHAR(50),
  qr_secret                  VARCHAR(100) NOT NULL DEFAULT md5(random()::text),
  company_name               VARCHAR(100),
  work_days_per_week         INT DEFAULT 6,
  rounding_threshold_minutes INT DEFAULT 30,
  shift_start                TIME DEFAULT '09:00',
  shift_end                  TIME DEFAULT '18:00',
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO settings DEFAULT VALUES;
```

### break_rules

```sql
CREATE TABLE break_rules (
  id                SERIAL PRIMARY KEY,
  threshold_hours   DECIMAL(3,1) NOT NULL,
  deduction_minutes INT NOT NULL
);

INSERT INTO break_rules (threshold_hours, deduction_minutes) VALUES
  (4.0, 15), (7.5, 60);
```

### holidays

```sql
CREATE TABLE holidays (
  id          SERIAL PRIMARY KEY,
  year        INT  NOT NULL,
  date        DATE NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  is_half_day BOOLEAN DEFAULT false
);
```

### db/seed.sql — İlk admin

```sql
INSERT INTO users (personnel_id, password_hash, name, role)
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oHGHCQp6y', -- "admin"
  'Sistem Yöneticisi',
  'admin'
) ON CONFLICT (personnel_id) DO NOTHING;
```

---

## Input Validation

Gelen veriyi route içinde doğrulayan katman — hiç bahsedilmemişti.

```javascript
// middleware/validate.js
export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema(req.body);
    if (error) return next(new AppError(error.message, 422));
    next();
  };
}

// Kullanım — routes/auth.js içinde:
import { validate } from '../middleware/validate.js';

const loginSchema = (body) => {
  if (!body.personnelId || typeof body.personnelId !== 'string')
    return { error: 'personnelId zorunlu' };
  if (!body.password || body.password.length < 4)
    return { error: 'Şifre en az 4 karakter olmalı' };
  return {};
};

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => { ... });
```

---

## Token Blacklist — Anlık Çıkış

JWT stateless — `/logout` çağrılsa bile token 8 saat geçerli kalır.
Bir personelin oturumunu hemen sonlandırmak için blacklist gerekir.

```sql
CREATE TABLE token_blacklist (
  jti        VARCHAR(36) PRIMARY KEY,  -- JWT ID (uuid)
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_blacklist_exp ON token_blacklist(expires_at);
```

Token üretilirken `jti` eklenir:

```javascript
const token = jwt.sign(
  { id: user.id, role: user.role, jti: crypto.randomUUID() },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
```

Logout ve middleware:

```javascript
// Çıkışta blacklist'e ekle
await db.query(
  'INSERT INTO token_blacklist (jti, expires_at) VALUES ($1, NOW() + interval \'8 hours\')',
  [req.user.jti]
);

// middleware/auth.js — her istekte kontrol
const { rows } = await db.query(
  'SELECT 1 FROM token_blacklist WHERE jti = $1', [decoded.jti]
);
if (rows.length) return next(new AppError('Oturum sonlandırılmış', 401));
```

Süresi dolmuş tokenları temizle (günde bir çalışır):

```javascript
// Cron job veya server başlangıcında:
await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
```

---

## Graceful Shutdown

Coolify container'ı yeniden başlatınca veya deploy gelince Node.js'e
`SIGTERM` sinyali gönderilir. Varsayılan davranış: anında ölür.
Sonuç: aktif QR tarama, dosya yükleme, DB transaction yarıda kesilir.

Graceful shutdown: yeni istek alma → mevcut istekleri bitir → DB'yi kapat → çık.

```typescript
// server.ts sonuna ekle
const server = app.listen(PORT, () => {
  logger.info(`Sunucu çalışıyor → http://localhost:${PORT}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} alındı — graceful shutdown başlıyor`);

  // Yeni bağlantı kabul etme
  server.close(async () => {
    logger.info('HTTP server kapatıldı');

    // DB bağlantı havuzunu kapat
    await db.end();
    logger.info('DB bağlantısı kapatıldı');

    // Redis bağlantısını kapat
    await redis.quit();
    logger.info('Redis bağlantısı kapatıldı');

    process.exit(0);
  });

  // 10 saniyede kapanmazsa zorla kapat
  setTimeout(() => {
    logger.error('Graceful shutdown zaman aşımı — zorla kapatılıyor');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

---

## Constants Dosyası

Kod seviyesi sabitler tek yerde. Rol/izin adları DB'den geliyor (RBAC
tabloları zaten var), event adları ve diğer kod sabitleri buraya girer.

```typescript
// shared/constants.ts — backend ve frontend paylaşır

// Event adları — emitter.emit() ve emitter.on() için
export const EVENTS = {
  ATTENDANCE_CHECKIN:   'attendance:checkin',
  ATTENDANCE_CHECKOUT:  'attendance:checkout',
  LEAVE_REQUESTED:      'leave:requested',
  LEAVE_APPROVED:       'leave:approved',
  LEAVE_REJECTED:       'leave:rejected',
  OVERTIME_REQUESTED:   'overtime:requested',
  OVERTIME_APPROVED:    'overtime:approved',
  NOTIFICATION_CREATED: 'notification:created',
} as const;

// SSE event tipleri
export const SSE_EVENTS = {
  ATTENDANCE:     'attendance',
  NEW_APPROVAL:   'new-approval',
  NOTIFICATION:   'notification',
  TEAM_MOVEMENT:  'team-movement',
} as const;

// Sayfalama varsayılanları
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT:     100,
} as const;

// Dosya boyutu limitleri
export const FILE_LIMITS = {
  AVATAR_BYTES: 2 * 1024 * 1024,   // 2MB
  ATTACH_BYTES: 5 * 1024 * 1024,   // 5MB
} as const;

// Token süreleri
export const TOKEN_TTL = {
  JWT_SECONDS:      8 * 60 * 60,    // 8 saat
  RESET_SECONDS:    60 * 60,         // 1 saat
  TOTP_WINDOW:      1,               // ±30 sn tolerans
} as const;
```

---

## Paylaşılan Tipler — shared/types/

Backend ve frontend aynı tip tanımlarını kullanır.
İki kez yazmak yerine tek kaynak.

```
shared/
  constants.ts    ← Sabitler
  types/
    user.ts       ← UserProfile, RoleName
    attendance.ts ← AttendanceLog
    leave.ts      ← LeaveRequest
    overtime.ts   ← OvertimeRequest
    company.ts    ← Company
    api.ts        ← API request/response tipleri
```

```typescript
// shared/types/user.ts
export type RoleName = 'admin' | 'mudur' | 'takim_lideri' | 'personel';

export interface UserProfile {
  id:                 string;
  personnelId:        string;
  name:               string;
  title?:             string;
  email?:             string;
  role:               RoleName;
  managerId?:         string;
  leaveBalance:       number;
  startDate?:         string;
  birthDate?:         string;
  canRemoteCheckIn:   boolean;
  avatarPath?:        string;
  companyId:          string;
  createdAt:          string;
}

// shared/types/api.ts
export interface ApiResponse<T = void> {
  success: true;
  data?:   T;
}
export interface ApiError {
  error: string;
}
export interface PaginatedResponse<T> {
  data:    T[];
  total:   number;
  page:    number;
  limit:   number;
}
```

Backend ve frontend aynı dosyayı import eder:
```typescript
// backend:  import { UserProfile } from '../../shared/types/user.js';
// frontend: import type { UserProfile } from '../../../shared/types/user.js';
```

---

## esbuild Pipeline — Tam Yapılandırma

TypeScript → JS derleme zorunlu (tarayıcı TS anlamaz).

```typescript
// build.ts
import esbuild from 'esbuild';

const isDev = process.argv.includes('--watch');

const config: esbuild.BuildOptions = {
  entryPoints: ['public/ts/app.ts'],
  bundle:      true,
  outfile:     'public/js/bundle.js',
  format:      'esm',
  target:      'es2020',
  sourcemap:   isDev ? true : false,    // Dev'de hata ayıklama için
  minify:      !isDev,                   // Production'da küçült
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
  },
};

if (isDev) {
  const ctx = await esbuild.context(config);
  await ctx.watch();                     // Her kayıtta otomatik derle
  console.log('esbuild watch modu — değişiklikler izleniyor');
} else {
  await esbuild.build(config);
  console.log('esbuild production build tamamlandı');
}
```

```json
// package.json
"scripts": {
  "build":       "tsc --noEmit && tsx build.ts",
  "build:watch": "tsx build.ts --watch",
  "dev":         "concurrently \"tsx watch server.ts\" \"tsx build.ts --watch\"",
  "start":       "node dist/server.js"
}
```

```bash
npm install -D concurrently
```

Dev'de iki şey paralel çalışır: sunucu (tsx watch) + frontend (esbuild watch).

---

## Request ID Tracking

Her isteğe UUID atanır. Tüm log satırları, Sentry hataları bu ID ile ilişkilendirilir.
Hata olduğunda: Sentry'den request ID al → logdan o ID'yi ara → tam hikayeyi gör.

```typescript
// middleware/requestId.ts
import { randomUUID } from 'crypto';

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
```

```typescript
// server.ts — en başa
app.use(requestId);

// Her log satırına request ID ekle
app.use((req, res, next) => {
  req.log = logger.child({ requestId: req.id });
  next();
});
```

```typescript
// Servis içinde kullanım
req.log.info('attendance:checkin', { userId, type, companyId });
// → { requestId: 'abc-123', message: 'attendance:checkin', userId: '...', ... }

// Hata handler
app.use((err, req, res, next) => {
  req.log.error('unhandled_error', { error: err.message });
  Sentry.withScope(scope => {
    scope.setTag('requestId', req.id);
    Sentry.captureException(err);
  });
  res.status(err.status || 500).json({ error: err.message, requestId: req.id });
});
```

---

## Güvenlik

### Content-Security-Policy (Helmet Özelleştirilmiş)

```typescript
// server.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],       // Inline script yok
      styleSrc:    ["'self'", "'unsafe-inline'"],  // CSS değişkenleri için
      imgSrc:      ["'self'", 'data:', process.env.R2_PUBLIC_URL || ''],
      fontSrc:     ["'self'"],
      connectSrc:  ["'self'"],       // SSE + API istekleri
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // PWA için gerekli
}));
```

### Tüm Cihazlardan Çıkış

Mevcut blacklist sadece o anki token'ı geçersiz kılar.
Çalıntı telefon senaryosu için tüm token'ları geçersiz kılma:

```sql
-- users tablosuna ekle
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
```

```typescript
// Login'de JWT'ye token_version ekle
const token = jwt.sign(
  { id: user.id, role: user.role, company_id: user.company_id,
    token_version: user.token_version,   // ← eklendi
    jti: randomUUID() },
  process.env.JWT_SECRET!,
  { expiresIn: '8h' }
);

// middleware/auth.ts — her istekte kontrol
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
const user    = await userRepo.findById(decoded.id, decoded.company_id);

if (user.token_version !== decoded.token_version)
  return next(new AppError('Oturum geçersiz — lütfen tekrar giriş yapın', 401));

// services/AuthService.ts — tüm cihazlardan çıkış
async logoutAll(userId: string, companyId: string) {
  // token_version artır → tüm eski token'lar geçersiz
  await userRepo.update(userId, { token_version: db.raw('token_version + 1') }, companyId);
  await this.audit(userId, 'logout_all_devices', 'users', userId, null, null);
}
```

### 2FA Brute Force Koruması

```typescript
// middleware/rateLimit.ts
export const twoFALimiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 dakika
  max:      5,                  // 5 deneme hakkı
  keyGenerator: (req) => `2fa:${req.user?.id}`,  // IP değil kullanıcı bazlı
  message: { error: '2FA denemesi aşıldı. 10 dakika bekleyin.' },
});

// routes/v1/auth.ts
router.post('/2fa/verify', requireAuth, twoFALimiter, verify2FA);
```

```typescript
// middleware/auth.ts — rate limit
import rateLimit from 'express-rate-limit';
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Çok fazla deneme. 15 dakika bekleyin.' },
});

---

## Dosya Yükleme

```javascript
// routes/leaves.js içinde
import multer from 'multer';
import path   from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/leaves/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(ok.includes(file.mimetype) ? null : new Error('Geçersiz dosya tipi'), ok.includes(file.mimetype));
  },
});

router.post('/:id/attach', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    await leaveService.setAttachment(req.params.id, req.user, req.file.path);
    res.json({ success: true });
  } catch (err) { next(err); }
});
```

---

## .env Şablonu

```env
PORT=3000
NODE_ENV=production
APP_URL=https://pdks.sirketiniz.com

JWT_SECRET=en_az_64_karakter_rastgele_string_buraya_openssl_rand_hex_32

DATABASE_URL=postgresql://user:pass@hostname:5432/pdks

# Redis — cache + job queue (opsiyonel, olmadan da çalışır)
REDIS_URL=redis://localhost:6379

VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@sirket.com
```

---

## package.json

```json
{
  "name": "pdks",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev":   "node --watch server.js"
  },
  "dependencies": {
    "express":            "^4.21.0",
    "pg":                 "^8.13.0",
    "bcryptjs":           "^3.0.0",
    "jsonwebtoken":       "^9.0.0",
    "web-push":           "^3.6.0",
    "multer":             "^1.4.0",
    "helmet":             "^8.0.0",
    "express-rate-limit": "^7.0.0",
    "cookie-parser":      "^1.4.0",
    "cors":               "^2.8.0",
    "dotenv":             "^17.0.0",
    "xlsx":               "^0.18.0",
    "ioredis":            "^5.3.0",   // Cache + job queue deposu
    "bullmq":             "^5.0.0"    // Job queue (Redis gerektirir)
  },
  "devDependencies": {
    "jest":      "^29.0.0",
    "supertest": "^6.0.0"
  }
}
```

Redis ve BullMQ opsiyonel — başlangıçta eklemeyebilirsin, sistem çalışır.
500+ kişi veya toplu bildirim gerekince eklersin.

**Browser kütüphaneleri CDN'den yüklenir — package.json'a girmez:**
```html
<!-- index.html içinde -->
<script src="https://cdn.jsdelivr.net/npm/idb@8/build/umd.js"></script>
```

**Şu an:** 40+ paket → **Yeni:** 12 paket

---

## API Versiyonlama

Şu an `/api/attendance` gibi versiyonsuz endpoint'ler var.
İleride bir endpoint'in davranışını değiştirmen gerekirse eski mobil
istemcileri bozarsın. `/api/v1/` prefix'i bunu önler.

```javascript
// server.js
import v1Routes from './routes/v1/index.js';
app.use('/api/v1', v1Routes);

// routes/v1/index.js
import { Router } from 'express';
import authRoute       from './auth.js';
import attendanceRoute from './attendance.js';
// ...

const router = Router();
router.use('/auth',       authRoute);
router.use('/attendance', attendanceRoute);
// ...
export default router;
```

Klasör değişikliği:
```
routes/
  v1/
    auth.js
    attendance.js
    leaves.js
    ...
```

Gelecekte v2 gerekirse:
```javascript
app.use('/api/v1', v1Routes);  // Eski istemciler çalışmaya devam eder
app.use('/api/v2', v2Routes);  // Yeni istemciler yeni endpoint kullanır
```

---

## Redis — Cache Katmanı

### Redis Nedir?

PostgreSQL disk tabanlıdır. Her sorgu → disk okuma.
Redis RAM tabanlıdır. Her okuma → nanosaniye.

```
İstek geldi → Redis'te var mı? → EVET → Anında döner  (DB'ye gitmedi)
                               → HAYIR → DB'ye sor → Sonucu Redis'e yaz → Döner
```

**Bu projede nerede lazım:**
- `settings` — her giriş/çıkış isteğinde okunuyor, nadiren değişiyor
- `holidays` — yıl boyunca sabit
- `user` profili — her API isteğinde JWT'den id alınıp DB'den çekiliyor

### Kurulum

```bash
# package.json'a ekle
npm install ioredis
```

Coolify'da: Databases → New Database → Redis → bağlantı string'i al.

### Kullanım

```javascript
// db/redis.js
import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL);
```

```javascript
// repositories/SettingsRepository.js içinde
import { redis } from '../db/redis.js';

async get() {
  // 1. Cache'e bak
  const cached = await redis.get('settings');
  if (cached) return JSON.parse(cached);

  // 2. DB'den oku
  const { rows } = await this.db.query('SELECT * FROM settings WHERE id = 1');
  const settings = rows[0];

  // 3. Cache'e yaz — 5 dakika geçerli
  await redis.setex('settings', 300, JSON.stringify(settings));

  return settings;
}

// Settings güncellenince cache'i temizle
async update(data) {
  await this.db.query('UPDATE settings SET ...');
  await redis.del('settings');  // Cache'i sıfırla, sonraki istek DB'den okur
}
```

### .env'e ekle

```env
REDIS_URL=redis://localhost:6379
```

---

## Job Queue — Arka Plan Görevleri

### Job Queue Nedir?

HTTP isteği içinde ağır iş yapılırsa kullanıcı bekler.

```
Kötü:  İstek geldi → 200 kişiye push gönder (30 sn) → cevap dön
İyi:   İstek geldi → "push gönderilecek" kuyruğa ekle → anında cevap dön
                                    ↓
                     Arka plan worker 200 kişiyi sırayla işler
```

**Bu projede nerede lazım:**
- Toplu push bildirimi (tüm personele duyuru)
- Excel raporu oluşturma (büyük veri setleri)
- E-posta gönderme (gelecekte eklenirse)

### BullMQ ile Kurulum

```bash
npm install bullmq
```

BullMQ, Redis'i kuyruk deposu olarak kullanır — Redis zaten kuruluysa hazır.

```javascript
// jobs/queue.js
import { Queue, Worker } from 'bullmq';
import { redis } from '../db/redis.js';

const connection = { host: redis.options.host, port: redis.options.port };

// Kuyruklar
export const pushQueue  = new Queue('push-notifications', { connection });
export const excelQueue = new Queue('excel-export',       { connection });
```

```javascript
// jobs/workers/pushWorker.js
import { Worker }              from 'bullmq';
import { NotificationService } from '../../services/NotificationService.js';

new Worker('push-notifications', async (job) => {
  const { userIds, title, body, link } = job.data;

  for (const userId of userIds) {
    await notifService.sendPush(userId, title, body, link);
    // Hata olursa sadece o kullanıcı atlanır, kalan devam eder
  }
}, { connection });
```

```javascript
// Servis içinde kullanım — anında döner
import { pushQueue } from '../jobs/queue.js';

export class NotificationService extends BaseService {
  async sendBulk({ userIds, title, body, link }) {
    // Kuyruğa ekle, işi worker halleder
    await pushQueue.add('bulk-push', { userIds, title, body, link });
  }
}
```

```javascript
// server.js'e worker'ları başlat
import './jobs/workers/pushWorker.js';
import './jobs/workers/excelWorker.js';
```

---

## SaaS ve Multi-Tenant Mimari

### Şu An Eksik Olan 4 Şey

```
1. companies tablosu yok        → hangi şirket sistemde kayıtlı bilinmiyor
2. Hiçbir tabloda company_id yok → tüm veriler iç içe, izolasyon yok
3. Hangi kullanıcının hangi şirkete ait olduğu bilinmiyor
4. Root ile normal admin aynı kavram → sistem sahibi ile müşteri yöneticisi ayrılmamış
```

Bu 4 eksik giderilmeden SaaS olmaz.

---

### Multi-Tenant Nedir?

```
Tenant = Kiracı = Şirket

Tek sunucu, tek veritabanı — ama her şirket birbirini göremez:

  ┌─────────────────────────────────────────┐
  │           PostgreSQL                    │
  │                                         │
  │  users: [company_id=A ...] [company_id=B ...] │
  │  attendance: [A kayıtları] [B kayıtları]│
  │                                         │
  │  Şirket A sadece kendi satırlarını görür│
  │  Şirket B sadece kendi satırlarını görür│
  └─────────────────────────────────────────┘
```

Yöntem: Her tabloya `company_id` sütunu eklenir. Middleware her
isteğe hangi şirketin token'ını gönderdiğini tespit eder ve
`BaseRepository` tüm sorguları otomatik `WHERE company_id = ?` ile filtreler.

---

### companies Tablosu

```sql
CREATE TABLE companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,  -- url dostu isim: "abc-lojistik"
  plan         VARCHAR(20) NOT NULL DEFAULT 'starter',
  -- 'starter' | 'pro' | 'enterprise'
  max_users    INT NOT NULL DEFAULT 50,        -- planda izin verilen maks kullanıcı
  is_active    BOOLEAN DEFAULT true,           -- askıya alınmış mı?
  trial_ends_at TIMESTAMPTZ,                   -- deneme süresi
  settings     JSONB DEFAULT '{}',             -- şirkete özel ek ayarlar
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_active ON companies(is_active);
```

---

### Her Tabloya company_id Eklenir

Mevcut tüm tablolara bu sütun eklenir:

```sql
-- Migration dosyası: db/migrations/002_add_company_id.sql

ALTER TABLE users
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE attendance
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE leave_requests
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE overtime_requests
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE settings
  ADD COLUMN company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE;
-- settings tek satır değil artık — her şirketin kendi ayarı var

ALTER TABLE break_rules
  ADD COLUMN company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE holidays
  ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
-- NULL = genel tatil (tüm şirketler görür), dolu = o şirkete özel

ALTER TABLE roles
  ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
-- NULL = sistem rolü (tüm şirketler görür)

ALTER TABLE audit_log
  ADD COLUMN company_id UUID REFERENCES companies(id);

-- İndeksler
CREATE INDEX idx_users_company       ON users(company_id);
CREATE INDEX idx_attendance_company  ON attendance(company_id);
CREATE INDEX idx_leaves_company      ON leave_requests(company_id);
CREATE INDEX idx_overtime_company    ON overtime_requests(company_id);
CREATE INDEX idx_notif_company       ON notifications(company_id);
```

---

### Tenant Middleware

Her istek → hangi şirket? → JWT'den al → request'e ekle → BaseRepository otomatik filtreler.

```javascript
// middleware/tenant.js
import { AppError } from '../core/AppError.js';
import { db }       from '../db/connection.js';

export async function resolveTenant(req, res, next) {
  // JWT'den company_id geliyor (login'de token'a eklendi)
  const companyId = req.user?.company_id;
  if (!companyId) return next(new AppError('Şirket bilgisi bulunamadı', 400));

  // Şirket aktif mi?
  const { rows } = await db.query(
    'SELECT id, name, plan, is_active, max_users FROM companies WHERE id = $1',
    [companyId]
  );

  if (!rows[0])          return next(new AppError('Şirket bulunamadı', 404));
  if (!rows[0].is_active) return next(new AppError('Hesabınız askıya alınmış', 403));

  req.company = rows[0];  // Tüm route'larda erişilebilir
  next();
}
```

```javascript
// server.js — auth sonrası, tüm API route'larından önce
app.use('/api/v1', requireAuth, resolveTenant, v1Routes);
```

---

### Güncellenmiş BaseRepository — company_id Otomatik

```javascript
// core/BaseRepository.js
export class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
    this.db    = db;
  }

  // companyId her sorguda zorunlu — unutulursa hata fırlatır
  _assertCompany(companyId) {
    if (!companyId) throw new Error(`${this.table}: companyId zorunlu`);
  }

  async findById(id, companyId) {
    this._assertCompany(companyId);
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.table}
       WHERE id = $1 AND company_id = $2 AND is_deleted = false`,
      [id, companyId]
    );
    return rows[0] || null;
  }

  async findAll({ companyId, where = '', params = [], orderBy = 'created_at DESC', limit = 100, offset = 0 }) {
    this._assertCompany(companyId);
    const extra = where ? `AND ${where}` : '';
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.table}
       WHERE company_id = $1 AND is_deleted = false ${extra}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 2} OFFSET $${params.length + 3}`,
      [companyId, ...params, limit, offset]
    );
    return rows;
  }

  async create(data, companyId) {
    this._assertCompany(companyId);
    const full = { ...data, company_id: companyId };
    const keys   = Object.keys(full);
    const values = Object.values(full);
    const cols   = keys.join(', ');
    const phs    = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await this.db.query(
      `INSERT INTO ${this.table} (${cols}) VALUES (${phs}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id, data, companyId) {
    this._assertCompany(companyId);
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const sets   = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await this.db.query(
      `UPDATE ${this.table}
       SET ${sets}, updated_at = NOW()
       WHERE id = $${keys.length + 1} AND company_id = $${keys.length + 2}
       RETURNING *`,
      [...values, id, companyId]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }

  async softDelete(id, companyId, deletedBy = null) {
    this._assertCompany(companyId);
    const { rows } = await this.db.query(
      `UPDATE ${this.table}
       SET is_deleted = true, deleted_at = NOW(), deleted_by = $3, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [id, companyId, deletedBy]
    );
    if (!rows[0]) throw new AppError('Kayıt bulunamadı', 404);
    return rows[0];
  }
}
```

---

### Güncellenmiş JWT — company_id İçeriyor

```javascript
// services/AuthService.js — login metodunda
const token = jwt.sign(
  {
    id:         user.id,
    role:       user.role,
    company_id: user.company_id,   // ← eklendi
    perms:      [...permissions],
    jti:        crypto.randomUUID(),
  },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
```

---

### PostgreSQL Row Level Security (İkinci Güvenlik Katmanı)

Middleware unutulsa bile RLS veritabanı seviyesinde korur:

```sql
-- RLS aktif et
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
-- ... tüm tablolar

-- Her tablo için policy
CREATE POLICY tenant_isolation ON users
  USING (company_id = current_setting('app.current_company_id')::uuid);

CREATE POLICY tenant_isolation ON attendance
  USING (company_id = current_setting('app.current_company_id')::uuid);
```

```javascript
// db/connection.js — her bağlantıda company_id set edilir
export async function withTenant(companyId, fn) {
  const client = await pool.connect();
  try {
    await client.query(`SET app.current_company_id = '${companyId}'`);
    return await fn(client);
  } finally {
    client.release();
  }
}
```

**Not:** RLS şimdilik opsiyonel — middleware yeterli. Yüksek güvenlik
gerektiğinde (finans, sağlık sektörü) aktif edilir.

---

### Kullanıcı Kotası Kontrolü

Her şirkette maksimum kullanıcı sınırı var (plana göre):

```javascript
// services/UserService.js
async create(data, actor, companyId) {
  const company = await companyRepo.findById(companyId);
  const count   = await userRepo.countActive(companyId);

  if (count >= company.max_users)
    throw new AppError(`Planınız en fazla ${company.max_users} kullanıcıya izin veriyor`, 403);

  return userRepo.create(data, companyId);
}
```

---

### settings Tablosu Güncellemesi

Artık tek satır değil — her şirketin kendi ayarı:

```sql
-- settings tablosuna PRIMARY KEY değişikliği
ALTER TABLE settings DROP CONSTRAINT single_row;
ALTER TABLE settings DROP COLUMN id;
ALTER TABLE settings ADD PRIMARY KEY (company_id);
```

```javascript
// Kullanım değişmez — middleware company_id sağlıyor
const settings = await settingsRepo.getByCompany(req.company.id);
```

---

### 500+ Personel İçin Eklemeler

| İhtiyaç | Çözüm | Neden |
|---------|-------|-------|
| DB yavaşlaması | Redis cache | Sık okunan veriler RAM'de |
| Toplu bildirim | BullMQ job queue | HTTP timeout olmadan |
| API yönetimi | `/api/v1/` versiyonlama | Eski istemciler bozulmasın |
| DB baskısı | Read replica | Okuma ayrı sunucuya |

---

## Şube (Branch) Sistemi

```
Şirket → Şubeler → Kullanıcılar

Genel Müdür  branch_id=NULL  → Tüm şubeleri görür
Şube Müdürü  branch_id=uuid  → Sadece kendi şubesi
Personel     branch_id=uuid  → Sadece kendi verisi
```

Mimari **%85 hazır** — `company_id` pattern'ının aynısı, bir katman aşağı.
Rewrite yok, extension var. Geriye dönük uyumlu — şube olmayan kullanıcılar
`branch_id = NULL` ile çalışmaya devam eder.

---

### Adım 1 — Migration

```sql
-- db/migrations/010_add_branches.sql

CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2-50 şube için yeterli
CREATE INDEX idx_branches_company    ON branches(company_id);
CREATE INDEX idx_branches_active     ON branches(company_id, is_active);

-- Tüm tablolara branch_id ekle
ALTER TABLE users            ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE attendance       ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE leave_requests   ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE overtime_requests ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE notifications    ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 10-50 şube için — sorgular branch_id ile hızlı olsun
CREATE INDEX idx_users_branch        ON users(branch_id)         WHERE branch_id IS NOT NULL;
CREATE INDEX idx_att_branch          ON attendance(branch_id)    WHERE branch_id IS NOT NULL;
CREATE INDEX idx_leaves_branch       ON leave_requests(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_overtime_branch     ON overtime_requests(branch_id) WHERE branch_id IS NOT NULL;

-- settings: NULL = şirket geneli, dolu = şubeye özel
ALTER TABLE settings ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
```

---

### Adım 2 — Permissions (3 Satır)

```sql
INSERT INTO permissions (name, label) VALUES
  ('branch:view_all', 'Tüm Şubeleri Görme'),   -- Genel Müdür
  ('branch:manage',   'Şube Yönetimi'),          -- Admin
  ('branch:view_own', 'Kendi Şubesini Görme');   -- Herkes

-- Genel müdür rolüne view_all ver
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'mudur' AND p.name = 'branch:view_all';
```

---

### Adım 3 — BaseRepository Opsiyonel Filtre

```typescript
// core/BaseRepository.ts — tek satır değişiklik
async findAll({ companyId, branchId, conditions = [], orderBy, limit, offset }) {
  const all = [
    { column: 'company_id', value: companyId },
    { column: 'is_deleted',  value: false },
    ...conditions,
  ];

  // branchId varsa filtrele, yoksa (null/undefined) tüm şubeler gelir
  if (branchId) all.push({ column: 'branch_id', value: branchId });

  // ... geri kalanı değişmez
}
```

---

### Adım 4 — JWT + Middleware

```typescript
// services/AuthService.ts — login'de branch_id ekle
const token = jwt.sign(
  {
    id:         user.id,
    role:       user.role,
    company_id: user.company_id,
    branch_id:  user.branch_id ?? null,  // NULL = tüm şubeler
    perms:      [...permissions],
    jti:        randomUUID(),
  },
  process.env.JWT_SECRET!,
  { expiresIn: '8h' }
);

// middleware/tenant.ts
export async function resolveTenant(req, res, next) {
  req.company  = await companyRepo.findById(req.user.company_id);
  req.branchId = req.user.branch_id ?? null;  // null = genel müdür, uuid = şube
  next();
}
```

---

### Adım 5 — BranchRepository

```typescript
// repositories/BranchRepository.ts
import { BaseRepository } from '../core/BaseRepository.js';
import { Branch }         from '../../shared/types/branch.js';

export class BranchRepository extends BaseRepository<Branch> {
  constructor() { super('branches'); }

  async findByCompany(companyId: string, { activeOnly = true } = {}) {
    return this.findAll({
      companyId,
      conditions: activeOnly ? [{ column: 'is_active', value: true }] : [],
      orderBy: 'name ASC',
      limit: 500,
      offset: 0,
    });
  }

  async findWithUserCount(companyId: string) {
    const { rows } = await this.db.query(
      `SELECT b.*, COUNT(u.id) AS user_count
       FROM branches b
       LEFT JOIN users u ON u.branch_id = b.id AND u.role != 'deleted'
       WHERE b.company_id = $1 AND b.is_active = true
       GROUP BY b.id
       ORDER BY b.name`,
      [companyId]
    );
    return rows;
  }
}
```

---

### Adım 6 — BranchService

```typescript
// services/BranchService.ts
import { BaseService }      from '../core/BaseService.js';
import { AppError }         from '../core/AppError.js';
import { BranchRepository } from '../repositories/BranchRepository.js';
import { redis }            from '../db/redis.js';

export class BranchService extends BaseService {
  constructor(private branchRepo: BranchRepository) { super(); }

  // 50-200 şube için: şube listesini cache'le
  async getAll(companyId: string) {
    const cacheKey = `branches:${companyId}`;
    const cached   = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const branches = await this.branchRepo.findByCompany(companyId);
    await redis.setex(cacheKey, 300, JSON.stringify(branches));  // 5 dk cache
    return branches;
  }

  async create(data: Partial<Branch>, actor: JwtPayload, companyId: string) {
    this.assertAdmin(actor);
    const branch = await this.branchRepo.create(data, companyId);
    await redis.del(`branches:${companyId}`);  // Cache'i temizle
    return branch;
  }

  async update(id: string, data: Partial<Branch>, actor: JwtPayload, companyId: string) {
    this.assertAdmin(actor);
    const branch = await this.branchRepo.update(id, data, companyId);
    await redis.del(`branches:${companyId}`);
    return branch;
  }

  async deactivate(id: string, actor: JwtPayload, companyId: string) {
    this.assertAdmin(actor);
    // Şubede personel var mı?
    const { rows } = await this.branchRepo.db.query(
      `SELECT COUNT(*) FROM users WHERE branch_id = $1 AND role != 'deleted'`,
      [id]
    );
    if (parseInt(rows[0].count) > 0)
      throw new AppError('Şubeye bağlı personel var. Önce personelleri taşıyın.', 409);

    await this.branchRepo.update(id, { is_active: false }, companyId);
    await redis.del(`branches:${companyId}`);
  }
}
```

---

### Adım 7 — API Endpoint

```typescript
// routes/v1/branches.ts
import { Router }           from 'express';
import { BranchService }    from '../../services/BranchService.js';
import { BranchRepository } from '../../repositories/BranchRepository.js';
import { requireAuth }      from '../../middleware/auth.js';
import { resolveTenant }    from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/roles.js';

const router  = Router();
const service = new BranchService(new BranchRepository());

// Tüm şubeleri listele
router.get('/', requireAuth, resolveTenant, async (req, res, next) => {
  try {
    const branches = await service.getAll(req.company.id);
    res.json(branches);
  } catch (err) { next(err); }
});

// Şube oluştur (admin)
router.post('/',
  requireAuth, resolveTenant, requirePermission('branch:manage'),
  async (req, res, next) => {
    try {
      const branch = await service.create(req.body, req.user, req.company.id);
      res.status(201).json(branch);
    } catch (err) { next(err); }
  }
);

// Şube güncelle (admin)
router.put('/:id',
  requireAuth, resolveTenant, requirePermission('branch:manage'),
  async (req, res, next) => {
    try {
      const branch = await service.update(req.params.id, req.body, req.user, req.company.id);
      res.json(branch);
    } catch (err) { next(err); }
  }
);

// Şube deaktif et (admin)
router.delete('/:id',
  requireAuth, resolveTenant, requirePermission('branch:manage'),
  async (req, res, next) => {
    try {
      await service.deactivate(req.params.id, req.user, req.company.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

export default router;
```

```typescript
// server.ts'e ekle — 1 satır
import branchesRoute from './routes/v1/branches.js';
app.use('/api/v1/branches', branchesRoute);
```

---

### Adım 8 — Frontend (Alpine.js)

```typescript
// public/ts/pages/BranchesPage.ts
Alpine.data('branchesPage', () => ({
  branches: [] as Branch[],
  loading:  false,
  form:     { name: '', city: '', address: '', phone: '' },
  editing:  null as Branch | null,

  async init() {
    this.branches = await api.get('/api/v1/branches');
  },

  async save() {
    this.loading = true;
    try {
      if (this.editing) {
        await api.put(`/api/v1/branches/${this.editing.id}`, this.form);
        Toast.show('Şube güncellendi.');
      } else {
        await api.post('/api/v1/branches', this.form);
        Toast.show('Şube oluşturuldu.');
      }
      this.form    = { name: '', city: '', address: '', phone: '' };
      this.editing = null;
      await this.init();
    } catch (err: any) {
      Toast.show(err.message, 'error');
    } finally { this.loading = false; }
  },

  edit(branch: Branch) {
    this.editing = branch;
    this.form    = { name: branch.name, city: branch.city || '',
                     address: branch.address || '', phone: branch.phone || '' };
  },

  async deactivate(id: string) {
    if (!confirm('Şubeyi deaktif etmek istiyor musunuz?')) return;
    try {
      await api.delete(`/api/v1/branches/${id}`);
      Toast.show('Şube deaktif edildi.');
      await this.init();
    } catch (err: any) { Toast.show(err.message, 'error'); }
  },
}));
```

---

### Service Katmanı — Otomatik Şube Filtresi

```typescript
// Her servis aynı pattern kullanır — AttendanceService örnek:
async getPage(user: JwtPayload, query: any) {
  const { page, limit } = this.paginate(query.page, query.limit);

  return this.attendanceRepo.findAll({
    companyId: user.company_id,
    branchId:  user.branch_id ?? undefined,
    // null → undefined → filtre eklenmez → tüm şubeler (genel müdür)
    // uuid → filtre eklenir → sadece o şube
    page, limit,
    month: query.month,
  });
}
```

---

### Ölçeğe Göre Hazırlık

| Şube | Hazırlık | Yapılan |
|------|----------|---------|
| 2-10 | Tam hazır | Indexler + migration yeterli |
| 10-50 | Hazır | Partial indexler (`WHERE branch_id IS NOT NULL`) eklendi |
| 50-200 | Hazır | Redis cache (5 dk) şube listesi için eklendi |
| 200+ | Read replica gerekir | SAAS-BUYUK-MIMARI.md |

---

### Geliştirme Sırası (Şube)

```
1. Migration 010_add_branches.sql çalıştır
2. shared/types/branch.ts tip tanımı
3. BranchRepository (BaseRepository'den 10 satır extend)
4. BranchService (Redis cache dahil)
5. routes/v1/branches.ts + server.ts'e 1 satır ekle
6. JWT + tenant middleware'e branch_id ekle
7. BaseRepository.findAll'a branchId filtresi
8. Her servisin getPage metoduna branchId ilet
9. Frontend BranchesPage (Alpine.js)
10. Permissions seed SQL çalıştır
```

**Toplam:** ~3-5 gün, mevcut hiçbir şey bozulmaz.

---

## Test Stratejisi

Hiç bahsedilmemişti. Her katman farklı test türüyle test edilir.

### Repository Katmanı — Entegrasyon Testi

Gerçek DB'ye karşı çalışır, mock kullanılmaz.

```javascript
// tests/repositories/AttendanceRepository.test.js
import { AttendanceRepository } from '../../repositories/AttendanceRepository.js';

const repo = new AttendanceRepository();

test('giriş kaydı oluşturulur', async () => {
  const log = await repo.create({
    user_id: testUserId,
    user_name: 'Test User',
    type: 'in',
    ip_address: '192.168.1.1',
    status: 'success',
  });

  expect(log.id).toBeDefined();
  expect(log.type).toBe('in');
});
```

### Service Katmanı — Unit Testi

Repository mock'lanır, sadece iş mantığı test edilir.

```javascript
// tests/services/AttendanceService.test.js
import { AttendanceService } from '../../services/AttendanceService.js';

const mockRepo     = { create: jest.fn(), findToday: jest.fn() };
const mockSettings = { get: jest.fn().mockResolvedValue({ office_ip: '1.2.3.4' }) };
const service      = new AttendanceService(mockRepo, mockSettings);

test('yanlış IP ile giriş reddedilir', async () => {
  await expect(
    service.checkIn({ userId: 'x', type: 'in', ip: '9.9.9.9' })
  ).rejects.toThrow('Sadece iş yeri ağından');
});

test('doğru IP ile giriş kaydedilir', async () => {
  mockRepo.create.mockResolvedValue({ id: 'abc', type: 'in' });
  const log = await service.checkIn({ userId: 'x', type: 'in', ip: '1.2.3.4' });
  expect(mockRepo.create).toHaveBeenCalledTimes(1);
  expect(log.type).toBe('in');
});
```

### Route Katmanı — API Testi

```javascript
// tests/routes/auth.test.js
import request from 'supertest';
import app     from '../../server.js';

test('yanlış şifre 401 döner', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ personnelId: 'admin', password: 'yanlis' });

  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Hatalı ID veya şifre');
});
```

```bash
npm install --save-dev jest supertest
```

```json
"scripts": {
  "test":    "node --experimental-vm-modules node_modules/.bin/jest",
  "test:watch": "jest --watch"
}
```

---

## DB Backup Stratejisi

### Coolify Otomatik Backup

Coolify'da PostgreSQL container'ı için:
```
Database ayarları → Backups → Enable automatic backups
Sıklık: Günlük
Saklama: 7 gün
```

Coolify yedekleri S3-uyumlu bir depolama alanına gönderebilir
(Cloudflare R2 ücretsiz 10GB sunar).

### Manuel Backup

```bash
# Yedek al
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Geri yükle
psql $DATABASE_URL < backup_20260601.sql
```

### package.json'a script ekle

```json
"scripts": {
  "backup": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M).sql"
}
```

### Önemli Not

`uploads/` klasörü (profil fotoğrafları, izin belgeleri) ayrıca
yedeklenmeli — Coolify volume backup bunu kapsamayabilir.
Günlük `rsync` veya Cloudflare R2'ye otomatik yükleme önerilir.

---

## API Uç Noktaları

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/password

GET    /api/users                  ?page=1&limit=50
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/avatar

GET    /api/attendance             ?page=1&limit=50&month=2026-06
POST   /api/attendance
PUT    /api/attendance/:id
DELETE /api/attendance/:id
GET    /api/attendance/today
GET    /api/attendance/export      ?userId=x&month=2026-06

GET    /api/leaves                 ?page=1&limit=50
POST   /api/leaves
POST   /api/leaves/:id/approve
POST   /api/leaves/:id/reject
DELETE /api/leaves/:id
POST   /api/leaves/:id/attach

GET    /api/overtime
POST   /api/overtime
POST   /api/overtime/:id/approve
POST   /api/overtime/:id/reject
DELETE /api/overtime/:id

GET    /api/notifications          ?limit=50
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

GET    /api/settings
PUT    /api/settings
POST   /api/settings/qr/rotate

POST   /api/push/subscribe

GET    /api/holidays               ?year=2026
POST   /api/holidays
DELETE /api/holidays/:id
```

---

## Yeni Modül Ekleme — Adım Adım

Örnek: "Vardiya" modülü

```
1. db/schema.sql → shifts tablosu ekle
2. core/BaseRepository.js → değişmez
3. repositories/ShiftRepository.js → extends BaseRepository
4. services/ShiftService.js → extends BaseService
5. routes/shifts.js → service'i çağırır
6. server.js → app.use('/api/shifts', requireAuth, shiftsRoute)  (1 satır)
7. public/js/pages/ShiftsPage.js → extends BasePage
8. public/js/core/Router.js → routes nesnesine ekle  (1 satır)
```

Başka hiçbir dosyaya dokunmak gerekmez.

---

## MySQL Sözdizim Farkları

| İşlem | PostgreSQL | MySQL |
|-------|-----------|-------|
| UUID | `gen_random_uuid()` | `UUID()` |
| Parametre | `$1, $2` | `?` |
| Insert sonrası ID | `RETURNING id` | `result.insertId` |
| JSON | `JSONB` | `JSON` veya `TEXT` |
| Boolean | `true/false` | `1/0` |
| Auto ID | `SERIAL` | `AUTO_INCREMENT` |
| Paket | `pg` | `mysql2` |

---

## Geliştirme Sırası

### Faz 0 — SaaS Altyapısı (Başta Yapılmalı)
```
0a. db/migrations/001_companies.sql → companies tablosu
0b. db/migrations/002_initial_schema.sql → tüm tablolar company_id ile
0c. db/migrations/003_rls_policies.sql → Row Level Security (opsiyonel)
0d. middleware/tenant.js → company_id çözümleme
0e. core/BaseRepository.js → company_id zorunlu tüm metodlarda
0f. seed.sql → test şirketi + root kullanıcısı
```

### Faz 1 — Temel (MVP)
```
1.  db/connection.js + db/migrate.js → npm run migrate
2.  core/AppError.js + core/BaseRepository.js + core/BaseService.js
3.  repositories/UserRepository.js + repositories/CompanyRepository.js
4.  services/AuthService.js (JWT'ye company_id eklendi)
5.  middleware/auth.js + middleware/tenant.js + middleware/roles.js
    middleware/rateLimit.js + middleware/validate.js
6.  routes/v1/auth.js + server.js iskelet
7.  public/index.html + core/ApiClient.js + core/StateManager.js + core/Router.js
8.  pages/LoginPage.js
9.  repositories/AttendanceRepository.js + services/AttendanceService.js
10. routes/v1/attendance.js + pages/HomePage.js
11. core/BasePage.js + core/BaseComponent.js + components/Toast.js + Modal.js
12. routes/v1/users.js + pages/UsersPage.js
13. routes/v1/leaves.js + pages/LeavesPage.js
14. routes/v1/overtime.js + pages/OvertimePage.js
15. routes/v1/notifications.js + pages/ApprovalsPage.js
16. routes/v1/settings.js + pages/SettingsPage.js
```

### Faz 2 — Bildirim ve PWA
```
18. events/emitter.js + events/setup.js + services/NotificationService.js
19. public/sw.js + manifest.json (PWA)
20. offline.js (IndexedDB — idb CDN'den)
21. services/ExcelService.js + /api/v1/attendance/export
```

### Faz 3 — Güvenlik ve Kalite
```
22. Token blacklist tablosu + middleware güncelleme
23. audit_log tablosu + BaseService.audit() metodu
24. tests/repositories/ + tests/services/ (jest)
25. Coolify: Docker volume /uploads bağla
26. Coolify: DB otomatik backup aç
27. db/redis.js + SettingsRepository cache
```

### Faz 4 — İleri Özellikler (Gerekirse)
```
28. jobs/queue.js + jobs/workers/ (BullMQ — toplu bildirim)
29. Multi-tenant: company_id sütunları
30. API v2 hazırlığı
```

---

## TypeScript Geçişi

### Neden TypeScript?

```
JavaScript:  Hata çalışırken patlar — kullanıcı görür
TypeScript:  Hata kod yazılırken görünür — geliştirici görür
```

Kod uzamaz. Tip tanımları eklenince IDE otomatik tamamlama yapar,
hata ayıklama süresi azalır, toplam yazılan kod miktarı düşer.

### Backend İçin (tsx ile build adımı yok)

```bash
npm install -D typescript tsx @types/node @types/express
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "./dist"
  }
}
```

```json
// package.json — değişen sadece bu
"scripts": {
  "start": "node dist/server.js",
  "build": "tsc",
  "dev":   "tsx watch server.ts"
}
```

Dosyalar `.js` → `.ts`, tür tanımları eklenir, geri kalanı aynı.

### Frontend İçin (build adımı yok — native ES modules)

Vanilla JS + TypeScript için esbuild ile:

```bash
npm install -D esbuild
```

```javascript
// build.js — 8 satır
import esbuild from 'esbuild';
await esbuild.build({
  entryPoints: ['public/ts/app.ts'],
  bundle: true,
  outfile: 'public/js/app.js',
  format: 'esm',
});
```

---

## BaseRepository — SQL Injection Düzeltmesi

Önceki `WHERE ${where}` string birleştirme SQL injection riskiydi.
Düzeltme: izin verilen sütun adları whitelist'ten geçer, değerler her
zaman parametre (`$1`, `$2`) olarak iletilir.

```typescript
// core/BaseRepository.ts

// İzin verilen sütun adları — whitelist
const ALLOWED_COLUMNS = new Set([
  'user_id', 'company_id', 'status', 'type', 'manager_id',
  'is_deleted', 'is_read', 'role', 'date', 'start_date', 'end_date'
]);

type WhereClause = { column: string; value: unknown }[];

export class BaseRepository<T> {
  constructor(protected table: string) {}

  private buildWhere(conditions: WhereClause, startIndex = 1) {
    const parts:  string[] = [];
    const values: unknown[] = [];

    for (const { column, value } of conditions) {
      if (!ALLOWED_COLUMNS.has(column))
        throw new Error(`İzinsiz sütun: ${column}`);
      parts.push(`${column} = $${startIndex + values.length}`);
      values.push(value);
    }

    return { sql: parts.join(' AND '), values };
  }

  async findAll({
    companyId,
    conditions = [] as WhereClause,
    orderBy = 'created_at DESC',
    limit = 100,
    offset = 0,
  }) {
    const { sql, values } = this.buildWhere([
      { column: 'company_id', value: companyId },
      { column: 'is_deleted', value: false },
      ...conditions,
    ]);

    const { rows } = await db.query<T>(
      `SELECT * FROM ${this.table}
       WHERE ${sql}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    return rows;
  }
}
```

---

## Token Blacklist — Redis'e Taşı

Her API isteğinde DB sorgusu → Redis ile anlık kontrol:

```typescript
// db/redis.ts
import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL!);

// Token blacklist metodları
export const blacklist = {
  async add(jti: string, ttlSeconds: number) {
    await redis.setex(`blacklist:${jti}`, ttlSeconds, '1');
  },
  async has(jti: string): Promise<boolean> {
    return (await redis.exists(`blacklist:${jti}`)) === 1;
  },
};
```

```typescript
// middleware/auth.ts
import { blacklist } from '../db/redis.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies.pdks_token;
  if (!token) return next(new AppError('Oturum gerekli', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Redis'te — nanosaniye hız, DB'ye gitmez
    if (await blacklist.has(decoded.jti))
      return next(new AppError('Oturum sonlandırılmış', 401));

    req.user = decoded;
    next();
  } catch {
    next(new AppError('Oturum süresi dolmuş', 401));
  }
}
```

---

## Rate Limiting — Tüm API'ye Yay

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis }  from '../db/redis.js';

// Genel limit — tüm API
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 dakika
  max:      120,         // 120 istek/dakika
  store:    new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message:  { error: 'Çok fazla istek. Bir dakika bekleyin.' },
});

// Login — çok sıkı
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  store:    new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message:  { error: 'Çok fazla başarısız deneme. 15 dakika bekleyin.' },
});

// Dosya yükleme — bant genişliği koruması
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { error: 'Çok fazla yükleme.' },
});
```

```typescript
// server.ts
app.use('/api/',             globalLimiter);       // Tüm API
app.use('/api/v1/auth/login', loginLimiter);       // Login daha sıkı
app.post('/api/v1/*/attach',  uploadLimiter);      // Dosya yükleme
```

---

## Gerçek Zamanlı Güncelleme — SSE

WebSocket çift yönlü (chat için), SSE tek yönlü sunucu → istemci.
PDKS için SSE yeterli ve çok daha basit.

### Ne İçin Kullanılır?

| Güncelleme | Olmadan | SSE ile |
|-----------|---------|---------|
| Admin dashboard (kim girdi?) | F5 | Anlık |
| Bekleyen onay sayacı | F5 | Anlık badge |
| Bildirim ikonu | F5 | Anlık |
| QR tarama sonucu | Polling | Anlık |
| Mesai otomatik tespiti | F5 | Anlık |

### Backend

```typescript
// routes/v1/events.ts
const clients = new Map<string, Response>();

router.get('/stream', requireAuth, resolveTenant, (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const clientId = `${req.user.id}-${Date.now()}`;
  clients.set(clientId, res);

  // Bağlantı kapanınca temizle
  req.on('close', () => clients.delete(clientId));
});

// Bir kullanıcıya olay gönder
export function pushToUser(userId: string, event: string, data: unknown) {
  clients.forEach((res, id) => {
    if (id.startsWith(userId)) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

// Şirketteki herkese gönder
export function pushToCompany(companyId: string, event: string, data: unknown) {
  // JWT'den companyId bilgisi clients Map'ine eklenmeli
  // (Implementasyon detayı — client bağlanırken companyId de saklanır)
}
```

```typescript
// events/setup.ts — event emitter'a SSE bağla
import { pushToUser } from '../routes/v1/events.js';

emitter.on('attendance:checkin', ({ userId, ...data }) => {
  pushToUser(userId, 'attendance', data);           // Personele
  pushToUser(data.managerId, 'team-attendance', data); // Yöneticiye
});

emitter.on('leave:requested', ({ managerId, ...data }) => {
  pushToUser(managerId, 'new-approval', data);
});
```

### Frontend

```typescript
// public/ts/core/EventStream.ts
export class EventStream {
  private source: EventSource | null = null;

  connect() {
    this.source = new EventSource('/api/v1/events/stream', {
      withCredentials: true
    });

    this.source.addEventListener('attendance', (e) => {
      const data = JSON.parse(e.data);
      bus.emit('attendance:new', data);   // Frontend EventBus'a ilet
    });

    this.source.addEventListener('new-approval', (e) => {
      const data = JSON.parse(e.data);
      bus.emit('approval:pending', data);
    });

    this.source.onerror = () => {
      setTimeout(() => this.connect(), 5000); // 5 saniyede yeniden bağlan
    };
  }

  disconnect() {
    this.source?.close();
  }
}
```

---

## Şifre Sıfırlama

İki mod: e-posta varsa token tabanlı, yoksa admin sıfırlama.

### Mod A — Admin Sıfırlama (E-posta Olmadan Çalışır)

```typescript
// routes/v1/users.ts
router.post('/:id/reset-password',
  requireAuth,
  requirePermission('user:manage'),
  async (req, res, next) => {
    try {
      const newPass = await userService.adminResetPassword(
        req.params.id,
        req.company.id,
        req.user.id
      );
      // newPass = rastgele üretilmiş geçici şifre
      res.json({ success: true, temporaryPassword: newPass });
    } catch (err) { next(err); }
  }
);
```

```typescript
// services/UserService.ts
async adminResetPassword(targetId: string, companyId: string, actorId: string) {
  const temp = Math.random().toString(36).slice(-8).toUpperCase();
  const hash = await bcrypt.hash(temp, 12);
  await this.userRepo.update(targetId, { password_hash: hash }, companyId);
  await this.audit(actorId, 'password_reset', 'users', targetId, null, null);
  return temp;  // Admin kullanıcıya söyler
}
```

### Mod B — E-posta ile Token Tabanlı (E-posta Sistemi Hazır Olunca)

```sql
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
// services/AuthService.ts
async requestPasswordReset(email: string, companyId: string) {
  const user  = await this.userRepo.findByEmail(email, companyId);
  if (!user) return; // Kullanıcı var mı yok mu söyleme (güvenlik)

  const token = crypto.randomUUID();
  const hash  = await bcrypt.hash(token, 10);

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + interval '1 hour')`,
    [user.id, hash]
  );

  // E-posta gönder (e-posta sistemi hazır olunca aktif et)
  // await emailService.sendPasswordReset(user.email, token);
}
```

---

## 2FA — İki Adımlı Doğrulama

Admin hesapları için zorunlu, personel için opsiyonel.
TOTP (Google Authenticator ile çalışır) — ücretsiz, SMS gerekmez.

```bash
npm install speakeasy qrcode
```

```sql
ALTER TABLE users ADD COLUMN totp_secret VARCHAR(100);
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT false;
```

```typescript
// services/AuthService.ts
async setup2FA(userId: string, companyId: string) {
  const secret = speakeasy.generateSecret({ name: 'PDKS' });
  await this.userRepo.update(userId, { totp_secret: secret.base32 }, companyId);

  // QR kod URL'si → admin bunu Google Authenticator ile okur
  const qrUrl = await qrcode.toDataURL(secret.otpauth_url!);
  return { qrUrl, secret: secret.base32 };
}

async verify2FA(userId: string, code: string, companyId: string) {
  const user = await this.userRepo.findById(userId, companyId);
  if (!user?.totp_secret) throw new AppError('2FA kurulmamış', 400);

  const valid = speakeasy.totp.verify({
    secret:   user.totp_secret,
    encoding: 'base32',
    token:    code,
    window:   1,  // 30 saniyelik tolerans
  });

  if (!valid) throw new AppError('Geçersiz kod', 401);
}
```

Login akışı:
```
1. Şifre doğru → 2FA aktif mi?
   - Hayır → token üret, giriş tamam
   - Evet  → { requires2FA: true, tempToken: ... } döndür
2. İstemci 6 haneli kodu gönderir → verify2FA
3. Doğru → gerçek JWT üret, giriş tamam
```

---

## E-posta Sistemi

Şimdilik şart değil — admin şifre sıfırlar, push bildirim var.
Hazır olunca tak-çalıştır şeklinde entegre edilebilir.

```typescript
// services/EmailService.ts — Resend ile (ücretsiz 100/gün)
import { Resend } from 'resend';

export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async send(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY yok, e-posta atlandı');
      return;  // Sistem çalışmaya devam eder
    }
    await this.resend.emails.send({
      from:    'PDKS <noreply@sirket.com>',
      to, subject, html,
    });
  }

  async sendPasswordReset(to: string, token: string) {
    await this.send(to, 'Şifre Sıfırlama', `
      <p>Şifre sıfırlama linkiniz:</p>
      <a href="${process.env.APP_URL}/reset-password?token=${token}">
        Şifremi Sıfırla
      </a>
      <p>Bu link 1 saat geçerlidir.</p>
    `);
  }
}
```

---

## Winston Loglama

`console.log` production'da yetersiz — kaybolur, aranmaz, seviyelendirilmez.

```bash
npm install winston winston-daily-rotate-file
```

```typescript
// core/Logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Konsol (geliştirme)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Tüm loglar (bilgi + hata)
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '30d',
    }),
    // Sadece hatalar
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '90d',
    }),
  ],
});
```

### Ne Loglanır?

```typescript
// Her istek — access log
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info('HTTP', {
      method: req.method, url: req.url,
      status: res.statusCode,
      company: req.company?.slug,
      user:    req.user?.id,
      ms:      Date.now() - req.startTime,
    });
  });
  next();
});

// Servis içinde iş logu
logger.info('attendance:checkin', { userId, type, ip, companyId });
logger.warn('rate_limit_hit',     { ip, endpoint });
logger.error('db_query_failed',   { table, error: err.message });
```

### Kim Görür?

```
Uygulama logları (logs/app-*.log)   → Geliştiriciler, root panel
Hata logları    (logs/error-*.log)  → Geliştiriciler, Sentry
Audit log       (audit_log tablosu) → Şirket adminleri (kendi şirketi)
                                    → Root panel (tüm şirketler)
```

---

## Sentry — Hata Takibi

Uygulama çalışırken hata fırlatınca sana e-posta atar.
"Satır 247, undefined error, son 1 saatte 12 kez oldu" detayı verir.

```bash
npm install @sentry/node
```

```typescript
// server.ts — en başa
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // %10 istek izlenir
});

// Global hata handler'dan önce
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// Global hata handler
app.use((err, req, res, next) => {
  if (err.status >= 500) Sentry.captureException(err);
  logger.error('unhandled_error', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({ error: err.message });
});
```

Ücretsiz plan: 5.000 hata/ay. Yeterli.

---

## CI/CD — GitHub Actions

```
Olmadan:  kod yaz → SSH → git pull → npm install → node server.js → parmak çek
CI/CD ile: git push → otomatik test → otomatik deploy → bildirim
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
      - run: npm test

  deploy:
    needs: test  # Test geçmeden deploy etme
    runs-on: ubuntu-latest
    steps:
      - name: Sunucuya deploy
        uses: appleboy/ssh-action@v1
        with:
          host:     ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key:      ${{ secrets.SSH_KEY }}
          script: |
            cd /app/pdks
            git pull origin main
            npm install --production
            pm2 restart pdks
```

GitHub'a her `git push main` yapınca:
1. Testler otomatik çalışır
2. Test geçerse sunucuya SSH açar, `git pull` yapar
3. PM2 uygulamayı yeniden başlatır

---

## CDN ve Dosya Depolama

Cloudflare zaten CDN görevi yapıyor — statik dosyaları (JS, CSS, resim)
önbelleğe alıp dağıtıyor. Ekstra CDN sunucusuna gerek yok.

`uploads/` için sorun şu: sunucu taşınınca dosyalar kaybolur.

### Cloudflare R2 (Ücretsiz 10 GB)

```bash
npm install @aws-sdk/client-s3  # R2, S3 API'si kullanır
```

```typescript
// services/StorageService.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export class StorageService {
  private s3 = new S3Client({
    region:   'auto',
    endpoint: process.env.R2_ENDPOINT,  // Cloudflare R2 URL
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });

  async upload(key: string, buffer: Buffer, mimeType: string) {
    await this.s3.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET!,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
    }));
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}
```

Multer ile entegrasyon: dosyayı `buffer`'a al, R2'ye yükle, URL'yi DB'ye kaydet.
Disk'e hiç yazmaz — sunucu bağımsız.

Şimdilik disk de çalışır. R2'ye geçiş: sadece `StorageService` değişir.

---

## PWA iOS Sınırları

PWA Android + Chrome'da tam çalışır. iOS'ta kısıtlar var:

| Özellik | Android/Chrome | iOS Safari |
|---------|----------------|------------|
| Push bildirimi | ✅ | ⚠️ iOS 16.4+ |
| Kamera (QR) | ✅ | ✅ |
| Offline cache | ✅ | ✅ |
| Ana ekrana ekle | ✅ | ✅ |
| Background sync | ✅ | ❌ |
| Bildirim izni | ✅ | ✅ iOS 16.4+ |

**Çözüm:** iOS 16.4 ve üstü destekleniyor. Kullanıcılara "Tarayıcınızı güncel tutun" uyarısı yeterli.
iOS 16.4 altındaki cihazlar için: bildirimlerin "uygulama açıkken çalıştığını" açıkla.

---

## İzleme ve Alarm

### Sentry — Hata takibi (yukarıda anlatıldı)

### Uptime Robot — Site çöküş tespiti

```
1. uptimerobot.com → Ücretsiz kayıt
2. "New Monitor" → HTTP(s)
3. URL: https://pdks.sirket.com/api/v1/health
4. Kontrol aralığı: 5 dakika
5. Bildirim: e-posta + SMS (SMS ücretli, e-posta ücretsiz)
```

```typescript
// routes/v1/health.ts — uptime robot bu endpoint'i çeker
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');  // DB bağlantısı sağlıklı mı?
    res.json({ status: 'ok', time: new Date() });
  } catch {
    res.status(503).json({ status: 'db_error' });
  }
});
```

---

## AI İçin Açık Uçlar

Şimdi eklenmez ama mimari hazır. Gelecekte:

```typescript
// services/AiService.ts — event emitter'a bağlanır
emitter.on('report:requested', (data) => aiService.generateSummary(data));
emitter.on('attendance:anomaly', (data) => aiService.analyzeAnomaly(data));

// Planlanan özellikler:
// - İzin taleplerini otomatik analiz et
// - Devam anomalilerini tespit et
// - Yönetici için akıllı özet rapor
// - Mesai tahminleme
```

Event emitter sayesinde AI servisi mevcut akışa dokunmadan eklenir.

---

## Geliştirme Sırası (Güncel)

### Faz 0 — SaaS Altyapısı
```
0a. TypeScript kurulumu (tsconfig.json + tsx)
0b. db/migrations/001_companies.sql
0c. db/migrations/002_initial_schema.sql (company_id + TypeScript tipleri)
0d. core/Logger.ts (Winston)
0e. middleware/tenant.ts
0f. core/BaseRepository.ts (SQL injection güvenli, TypeScript)
```

### Faz 1 — Temel (MVP)
```
1.  db/connection.ts + db/migrate.ts
2.  core/AppError.ts + core/BaseRepository.ts + core/BaseService.ts
3.  repositories/UserRepository.ts + repositories/CompanyRepository.ts
4.  services/AuthService.ts (JWT + company_id + 2FA hazırlığı)
5.  middleware/auth.ts + middleware/tenant.ts + middleware/roles.ts
    middleware/rateLimit.ts (global + login) + middleware/validate.ts
6.  routes/v1/auth.ts + server.ts + Sentry init
7.  public/ts/core/ApiClient.ts + StateManager.ts + Router.ts
8.  pages/LoginPage.ts
9.  AttendanceRepository.ts + AttendanceService.ts
10. routes/v1/attendance.ts + pages/HomePage.ts
11. BasePage.ts + BaseComponent.ts + Toast.ts + Modal.ts
12. routes/v1/users.ts + pages/UsersPage.ts
13. routes/v1/leaves.ts + pages/LeavesPage.ts
14. routes/v1/overtime.ts + pages/OvertimePage.ts
15. routes/v1/notifications.ts + pages/ApprovalsPage.ts
16. routes/v1/settings.ts + pages/SettingsPage.ts
```

### Faz 2 — Gerçek Zamanlı + PWA
```
17. routes/v1/events.ts (SSE stream)
18. EventStream.ts (frontend)
19. events/emitter.ts + events/setup.ts + SSE bağlantısı
20. NotificationService.ts
21. public/sw.ts + manifest.json (PWA)
22. offline.ts (IndexedDB)
23. ExcelService.ts
```

### Faz 3 — Güvenlik ve Kalite
```
24. Token blacklist → Redis'e taşı
25. 2FA (speakeasy) — admin için
26. Şifre sıfırlama (admin modu)
27. audit_log + BaseService.audit()
28. tests/ (jest)
29. .github/workflows/deploy.yml (CI/CD)
30. Coolify: Docker volume + DB backup
31. Uptime Robot kurulumu
32. StorageService.ts (Cloudflare R2) — opsiyonel
```

### Faz 3.5 — Şube Sistemi (Faz 3 bittikten sonra, Faz 4'ten önce)
```
33. db/migrations/010_add_branches.sql çalıştır
34. shared/types/branch.ts
35. BranchRepository + BranchService (Redis cache dahil)
36. routes/v1/branches.ts + server.ts'e 1 satır
37. JWT + tenant middleware'e branch_id ekle
38. BaseRepository.findAll'a branchId filtresi
39. Her servisin getPage metoduna branchId ilet
40. pages/BranchesPage.ts (Alpine.js)
41. permissions seed SQL (3 satır)
```

### Faz 4 — İleri Özellikler
```
42. BullMQ job queue (toplu bildirim)
43. E-posta sistemi (Resend)
44. Şifre sıfırlama (e-posta token ile)
45. API v2 hazırlığı
46. AI servisleri (event emitter'a bağlı)
47. Root panel (ayrı uygulama)
```

---

*Plan tarihi: 2026-06-01 — Revize 4*
