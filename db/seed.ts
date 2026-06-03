import { db } from './connection.js';
import bcrypt from 'bcryptjs';

async function seed() {
  // Test şirketi oluştur
  const { rows: existing } = await db.query(
    `SELECT id FROM companies WHERE slug = 'test'`
  );

  let companyId: string;

  if (existing.length > 0) {
    companyId = existing[0].id;
    console.log('Test şirketi zaten var:', companyId);
  } else {
    const { rows } = await db.query(
      `INSERT INTO companies (name, slug, plan, max_users)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['PDKS Test A.Ş.', 'test', 'starter', 50]
    );
    companyId = rows[0].id;

    // Şirket ayarlarını oluştur
    await db.query(
      `INSERT INTO settings (company_id, company_name) VALUES ($1, $2)`,
      [companyId, 'PDKS Test A.Ş.']
    );

    // Varsayılan mola kurallarını ekle
    await db.query(
      `INSERT INTO break_rules (company_id, threshold_hours, deduction_minutes) VALUES
       ($1, 4.0, 15), ($1, 7.5, 60)`,
      [companyId]
    );

    console.log('Test şirketi oluşturuldu:', companyId);
  }

  // Admin kullanıcı oluştur
  const { rows: adminExisting } = await db.query(
    `SELECT id FROM users WHERE company_id = $1 AND personnel_id = 'admin'`,
    [companyId]
  );

  if (adminExisting.length > 0) {
    console.log('Admin kullanıcı zaten var.');
  } else {
    const hash = await bcrypt.hash('admin123', 12);
    await db.query(
      `INSERT INTO users (company_id, personnel_id, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [companyId, 'admin', hash, 'Sistem Yöneticisi', 'admin']
    );
    console.log('Admin kullanıcı oluşturuldu: ID=admin, Şifre=admin123');
  }

  await db.end();
  console.log('Seed tamamlandı.');
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
