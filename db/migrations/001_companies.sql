-- Şirketler tablosu — SaaS altyapısı, baştan doğru kur
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  plan          VARCHAR(20) NOT NULL DEFAULT 'starter'
                CHECK (plan IN ('starter', 'pro', 'enterprise')),
  max_users     INT NOT NULL DEFAULT 50,
  is_active     BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug   ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
