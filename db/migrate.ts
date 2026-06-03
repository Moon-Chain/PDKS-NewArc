import { db } from './connection.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows: applied } = await db.query('SELECT filename FROM _migrations');
  const done = new Set(applied.map((r: { filename: string }) => r.filename));

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    if (done.has(file)) {
      console.log(`  atlandı: ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`✓ ${file}`);
  }

  console.log('Migration tamamlandı.');
  await db.end();
}

migrate().catch((err) => {
  console.error('Migration hatası:', err);
  process.exit(1);
});
