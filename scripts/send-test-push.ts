import dotenv from 'dotenv';
dotenv.config();
import { db } from '../db/connection.js';
import webpush from 'web-push';

const pub   = process.env.VAPID_PUBLIC_KEY ?? '';
const priv  = process.env.VAPID_PRIVATE_KEY ?? '';
const email = process.env.VAPID_EMAIL ?? 'mailto:admin@pdks.com';

if (!pub || !priv) {
  console.log('❌ VAPID anahtarları .env dosyasında tanımlanmamış.');
  console.log('   Profil sayfasından push bildirimi etkinleştirmeyi dene.');
  await db.end();
  process.exit(1);
}

webpush.setVapidDetails(email, pub, priv);

const { rows } = await db.query<{ id: string; name: string; push_subscription: webpush.PushSubscription }>(
  `SELECT id, name, push_subscription FROM users WHERE push_subscription IS NOT NULL AND is_deleted = false`
);

if (rows.length === 0) {
  console.log('❌ Hiçbir kullanıcıda push subscription yok.');
  await db.end();
  process.exit(1);
}

for (const user of rows) {
  try {
    await webpush.sendNotification(
      user.push_subscription,
      JSON.stringify({
        title: 'PDKS Test Bildirimi',
        body:  `Merhaba ${user.name}! Push bildirimler çalışıyor 🎉`,
        url:   '/notifications',
      }),
      { TTL: 60 }
    );
    console.log(`✅ Gönderildi → ${user.name}`);
  } catch (err) {
    console.error(`❌ ${user.name}: ${(err as Error).message}`);
  }
}

await db.end();
