-- updated_at otomatik trigger — bir kez tanımla, tüm tablolarda kullan
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  personnel_id        VARCHAR(50) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  name                VARCHAR(100) NOT NULL,
  title               VARCHAR(100),
  email               VARCHAR(150),
  role                VARCHAR(20) NOT NULL DEFAULT 'personel'
                      CHECK (role IN ('admin','mudur','takim_lideri','personel','deleted')),
  manager_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  leave_balance       INT NOT NULL DEFAULT 14,
  start_date          DATE,
  birth_date          DATE,
  allowed_device      TEXT,
  device_id           VARCHAR(100),
  push_subscription   JSONB,
  can_remote_check_in BOOLEAN DEFAULT false,
  avatar_path         VARCHAR(255),
  token_version       INT NOT NULL DEFAULT 0,
  is_deleted          BOOLEAN DEFAULT false,
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID REFERENCES users(id),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, personnel_id)
);

CREATE INDEX IF NOT EXISTS idx_users_company    ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_pid        ON users(company_id, personnel_id);
CREATE INDEX IF NOT EXISTS idx_users_manager    ON users(manager_id);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Devam kayıtları
CREATE TABLE IF NOT EXISTS attendance (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id),
  user_name      VARCHAR(100) NOT NULL,
  type           VARCHAR(3) NOT NULL CHECK (type IN ('in','out')),
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address     VARCHAR(100),
  status         VARCHAR(10) DEFAULT 'success'
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

CREATE INDEX IF NOT EXISTS idx_att_company ON attendance(company_id);
CREATE INDEX IF NOT EXISTS idx_att_user    ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_att_ts      ON attendance(timestamp DESC);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- İzin talepleri
CREATE TABLE IF NOT EXISTS leave_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  user_name       VARCHAR(100) NOT NULL,
  manager_id      UUID NOT NULL REFERENCES users(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days            INT NOT NULL CHECK (days > 0),
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

CREATE INDEX IF NOT EXISTS idx_leave_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_user    ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_manager ON leave_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_status  ON leave_requests(status);

CREATE TRIGGER trg_leaves_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mesai talepleri
CREATE TABLE IF NOT EXISTS overtime_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_overtime_company ON overtime_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_overtime_user    ON overtime_requests(user_id);

CREATE TRIGGER trg_overtime_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_notif_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread  ON notifications(user_id, is_read) WHERE is_read = false;

-- Ayarlar — her şirketin kendi ayarı (company_id = PK)
CREATE TABLE IF NOT EXISTS settings (
  company_id                 UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  office_ip                  VARCHAR(50),
  qr_secret                  VARCHAR(100) NOT NULL DEFAULT md5(random()::text),
  company_name               VARCHAR(100),
  work_days_per_week         INT DEFAULT 6,
  rounding_threshold_minutes INT DEFAULT 30,
  shift_start                TIME DEFAULT '09:00',
  shift_end                  TIME DEFAULT '18:00',
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Mola kuralları
CREATE TABLE IF NOT EXISTS break_rules (
  id                SERIAL PRIMARY KEY,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  threshold_hours   DECIMAL(3,1) NOT NULL,
  deduction_minutes INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_break_company ON break_rules(company_id);

-- Tatil günleri — NULL company_id = genel tatil (tüm şirketler)
CREATE TABLE IF NOT EXISTS holidays (
  id          SERIAL PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  year        INT NOT NULL,
  date        DATE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  is_half_day BOOLEAN DEFAULT false,
  UNIQUE(company_id, date)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id),
  actor_id     UUID NOT NULL REFERENCES users(id),
  actor_name   VARCHAR(100) NOT NULL,
  action       VARCHAR(50) NOT NULL,
  target_table VARCHAR(50),
  target_id    UUID,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   VARCHAR(100),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_time    ON audit_log(created_at DESC);

-- Token blacklist — Redis olmadan DB tablosu kullanılır
CREATE TABLE IF NOT EXISTS token_blacklist (
  jti        VARCHAR(36) PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blacklist_exp ON token_blacklist(expires_at);
