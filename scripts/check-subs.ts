import { db } from '../db/connection.js';
const { rows } = await db.query(`SELECT id, name, push_subscription IS NOT NULL as has_sub FROM users WHERE is_deleted=false`);
rows.forEach(r => console.log(r.name, '-', (r as {has_sub: boolean}).has_sub ? '✅ SUBSCRIPTION VAR' : '❌ yok'));
await db.end();
