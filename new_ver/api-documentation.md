# PDKS API Dokümantasyonu

Base URL: `https://pdks.sirket.com/api/v1`  
Auth: HTTP-only cookie (`pdks_token`)  
Format: JSON

---

## Auth

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/login` | Giriş — body: `{ personnelId, password, deviceId }` |
| POST | `/auth/logout` | Çıkış |
| GET  | `/auth/me` | Oturum bilgisi |
| PUT  | `/auth/password` | Şifre değiştir — body: `{ currentPassword, newPassword }` |
| POST | `/auth/2fa/setup` | 2FA kur — QR URL döner |
| POST | `/auth/2fa/verify` | 2FA doğrula — body: `{ code }` |
| POST | `/auth/reset-password/request` | Şifre sıfırlama isteği (e-posta gerekir) |
| POST | `/auth/reset-password/confirm` | Token ile sıfırla — body: `{ token, newPassword }` |

---

## Users

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/users?page=1&limit=50` | admin, mudur |
| POST | `/users` | admin |
| GET  | `/users/:id` | admin, mudur, kendisi |
| PUT  | `/users/:id` | admin, mudur (sınırlı) |
| DELETE | `/users/:id` | admin |
| POST | `/users/:id/avatar` | kendisi, admin |
| POST | `/users/:id/reset-password` | admin |

---

## Attendance

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/attendance?page=1&month=2026-06` | rol bazlı filtreli |
| POST | `/attendance` | tüm aktif kullanıcılar |
| PUT  | `/attendance/:id` | admin, yöneticisi |
| DELETE | `/attendance/:id` | admin, yöneticisi |
| GET  | `/attendance/today` | admin, mudur |
| GET  | `/attendance/export?userId=x&month=2026-06` | admin, mudur |

---

## Leaves

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/leaves?page=1` | rol bazlı |
| POST | `/leaves` | personel |
| POST | `/leaves/:id/approve` | yönetici |
| POST | `/leaves/:id/reject` | yönetici |
| DELETE | `/leaves/:id` | admin |
| POST | `/leaves/:id/attach` | multipart/form-data |

---

## Overtime

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/overtime` | rol bazlı |
| POST | `/overtime` | personel |
| POST | `/overtime/:id/approve` | yönetici |
| POST | `/overtime/:id/reject` | yönetici |
| DELETE | `/overtime/:id` | admin |

---

## Notifications

| Method | Endpoint |
|--------|----------|
| GET  | `/notifications?limit=50` |
| PUT  | `/notifications/:id/read` |
| PUT  | `/notifications/read-all` |

---

## Settings

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/settings` | giriş yapmış herkes |
| PUT  | `/settings` | admin |
| POST | `/settings/qr/rotate` | admin |

---

## Push

| Method | Endpoint |
|--------|----------|
| POST | `/push/subscribe` — body: `{ subscription }` |

---

## Holidays

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET  | `/holidays?year=2026` | hepsi |
| POST | `/holidays` | admin |
| DELETE | `/holidays/:id` | admin |

---

## Events (SSE)

| Method | Endpoint |
|--------|----------|
| GET  | `/events/stream` — `text/event-stream` |

Event tipleri: `attendance`, `new-approval`, `notification`, `team-attendance`

---

## Health

| Method | Endpoint |
|--------|----------|
| GET  | `/health` — `{ status: 'ok', time: ... }` |

---

## Hata Formatı

```json
{ "error": "Hata mesajı" }
```

HTTP status: 400 validation, 401 auth, 403 yetki, 404 bulunamadı, 500 sunucu

---

## Notlar

- Tüm istekler `credentials: 'include'` ile yapılmalı (cookie)
- Tüm tarihler ISO 8601 (2026-06-01T09:00:00Z)
- Sayfalama: `?page=1&limit=50` (max limit: 100)
- Soft delete: kayıtlar gerçekten silinmez, `is_deleted=true` olur
