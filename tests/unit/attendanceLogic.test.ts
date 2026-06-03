// Giriş/Çıkış iş mantığı testleri — DB bağımlılığı yok (saf fonksiyon)

const COOLDOWN_MS = 60_000;

// AttendanceService'deki cooldown mantığını izole ederek test ediyoruz
function checkCooldown(lastTimestamp: string | null): { ok: boolean; remainingSec: number } {
  if (!lastTimestamp) return { ok: true, remainingSec: 0 };
  const elapsed   = Date.now() - new Date(lastTimestamp).getTime();
  const remaining = COOLDOWN_MS - elapsed;
  if (remaining > 0) return { ok: false, remainingSec: Math.ceil(remaining / 1000) };
  return { ok: true, remainingSec: 0 };
}

// IP kontrolü — izole mantık
function checkIp(officeIp: string | null, requestIp: string): { allowed: boolean; reason?: string } {
  if (!officeIp) return { allowed: true }; // IP kısıtı yok
  if (requestIp === officeIp) return { allowed: true };
  return { allowed: false, reason: 'Sadece iş yeri ağından giriş yapılabilir' };
}

// Çalışma saati hesabı (hareket raporunda kullanılıyor)
function calcWorkHours(firstIn: string | null, lastOut: string | null): number {
  if (!firstIn || !lastOut) return 0;
  const diff = new Date(lastOut).getTime() - new Date(firstIn).getTime();
  if (diff <= 0) return 0;
  return Math.round((diff / 3_600_000) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────

describe('Cooldown mantığı', () => {

  it('son kayıt yoksa giriş serbest', () => {
    const result = checkCooldown(null);
    expect(result.ok).toBe(true);
    expect(result.remainingSec).toBe(0);
  });

  it('65 saniye önce kayıt → cooldown bitti, serbest', () => {
    const past = new Date(Date.now() - 65_000).toISOString();
    const result = checkCooldown(past);
    expect(result.ok).toBe(true);
  });

  it('30 saniye önce kayıt → ~30 saniye bekle', () => {
    const past = new Date(Date.now() - 30_000).toISOString();
    const result = checkCooldown(past);
    expect(result.ok).toBe(false);
    expect(result.remainingSec).toBeGreaterThanOrEqual(28);
    expect(result.remainingSec).toBeLessThanOrEqual(31);
  });

  it('az önce kayıt → ~60 saniye bekle', () => {
    const now = new Date().toISOString();
    const result = checkCooldown(now);
    expect(result.ok).toBe(false);
    expect(result.remainingSec).toBeGreaterThanOrEqual(58);
    expect(result.remainingSec).toBeLessThanOrEqual(61);
  });

  it('tam 60 saniye önce → serbest (sınır değeri)', () => {
    const past = new Date(Date.now() - 60_001).toISOString();
    expect(checkCooldown(past).ok).toBe(true);
  });
});

describe('IP kontrolü', () => {

  it('ofis IP ayarlanmamışsa herkese izin', () => {
    expect(checkIp(null, '192.168.1.100').allowed).toBe(true);
    expect(checkIp(null, '1.2.3.4').allowed).toBe(true);
  });

  it('ofis IP ile eşleşiyorsa izin', () => {
    expect(checkIp('192.168.1.1', '192.168.1.1').allowed).toBe(true);
  });

  it('farklı IP → reddedilir + hata mesajı', () => {
    const result = checkIp('192.168.1.1', '10.0.0.5');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('iş yeri');
  });

  it('dış IP (mobil veri) → reddedilir', () => {
    expect(checkIp('192.168.1.1', '78.45.100.200').allowed).toBe(false);
  });

  it('localhost geliştirme ortamında → ofis IP boşsa izin', () => {
    expect(checkIp(null, '127.0.0.1').allowed).toBe(true);
  });
});

describe('Çalışma saati hesabı', () => {

  it('8 saatlik mesai doğru hesaplanır', () => {
    expect(calcWorkHours('2026-06-01T08:00:00Z', '2026-06-01T16:00:00Z')).toBe(8);
  });

  it('8.5 saatlik mesai doğru hesaplanır', () => {
    expect(calcWorkHours('2026-06-01T09:00:00Z', '2026-06-01T17:30:00Z')).toBe(8.5);
  });

  it('giriş yoksa 0', () => {
    expect(calcWorkHours(null, '2026-06-01T17:00:00Z')).toBe(0);
  });

  it('çıkış yoksa 0', () => {
    expect(calcWorkHours('2026-06-01T09:00:00Z', null)).toBe(0);
  });

  it('çıkış < giriş (hatalı veri) → 0', () => {
    expect(calcWorkHours('2026-06-01T17:00:00Z', '2026-06-01T09:00:00Z')).toBe(0);
  });

  it('kısa mola (1 saat) doğru', () => {
    expect(calcWorkHours('2026-06-01T13:00:00Z', '2026-06-01T14:00:00Z')).toBe(1);
  });
});
