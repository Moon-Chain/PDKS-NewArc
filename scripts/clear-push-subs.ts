import { db } from '../db/connection.js';

const { rowCount } = await db.query('UPDATE users SET push_subscription = NULL WHERE push_subscription IS NOT NULL');
console.log(`✅ ${rowCount} push subscription temizlendi`);
await db.end();
