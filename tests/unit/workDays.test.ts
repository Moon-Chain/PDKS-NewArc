// İzin bakiyesi hesabı — iş günü sayısı testi
// Frontend'deki workDays() ile aynı mantık

function workDays(s: string, e: string, holidaySet: Set<string> = new Set()): number {
  const start = new Date(s), end = new Date(e);
  if (end < start) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const iso = cur.toISOString().split('T')[0];
    const dow = cur.getDay();
    // Pazar=0 ve Cumartesi=6 hariç (5 günlük çalışma haftası)
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, n);
}

describe('workDays — iş günü hesabı', () => {

  describe('Temel durum', () => {
    it('tek bir iş günü = 1', () => {
      // 2026-06-01 Pazartesi
      expect(workDays('2026-06-01', '2026-06-01')).toBe(1);
    });

    it('Pazartesi–Cuma = 5 iş günü', () => {
      expect(workDays('2026-06-01', '2026-06-05')).toBe(5);
    });

    it('tam hafta (Pzt–Paz) = 5 iş günü', () => {
      expect(workDays('2026-06-01', '2026-06-07')).toBe(5);
    });

    it('2 hafta = 10 iş günü', () => {
      expect(workDays('2026-06-01', '2026-06-14')).toBe(10);
    });
  });

  describe('Hafta sonu', () => {
    it('Cumartesi = 1 döner (minimum 1 kural)', () => {
      // 2026-06-06 Cumartesi
      expect(workDays('2026-06-06', '2026-06-06')).toBe(1);
    });

    it('Cumartesi–Pazar = 1 döner (minimum 1 kural)', () => {
      expect(workDays('2026-06-06', '2026-06-07')).toBe(1);
    });

    it('Cuma + hafta sonu = 1 iş günü', () => {
      // Sadece Cuma iş günü, Cmt+Paz sayılmaz
      expect(workDays('2026-06-05', '2026-06-07')).toBe(1);
    });
  });

  describe('Tatil günleri', () => {
    const TR_HOLIDAYS_2026 = new Set([
      '2026-01-01', // Yılbaşı
      '2026-04-23', // 23 Nisan
      '2026-05-01', // 1 Mayıs
      '2026-05-19', // 19 Mayıs
      '2026-07-15', // 15 Temmuz
      '2026-08-30', // 30 Ağustos
      '2026-10-29', // Cumhuriyet
    ]);

    it('Yılbaşı (1 Ocak) tatil olarak sayılmaz', () => {
      // Tek gün seçilse bile minimum 1 döner
      expect(workDays('2026-01-01', '2026-01-01', TR_HOLIDAYS_2026)).toBe(1);
    });

    it('Tatil günü içeren 3 günlük talep: sadece iş günleri sayılır', () => {
      // 19 Mayıs Salı (tatil), 20 Mayıs Çar, 21 Mayıs Per → 2 iş günü
      expect(workDays('2026-05-19', '2026-05-21', TR_HOLIDAYS_2026)).toBe(2);
    });

    it('Tatil + hafta sonu beraber hariç tutulur', () => {
      // Ramazan: 20-22 Mart Cuma/Cmt/Paz — tatil + hafta sonu
      const ramadan = new Set(['2026-03-20', '2026-03-21', '2026-03-22']);
      // 19 Mart (Per) + 20-22 tatil + 23 Pzt = 2 iş günü
      expect(workDays('2026-03-19', '2026-03-23', ramadan)).toBe(2);
    });
  });

  describe('Edge case', () => {
    it('bitiş < başlangıç = 0', () => {
      expect(workDays('2026-06-10', '2026-06-01')).toBe(0);
    });

    it('aynı gün Pzt = 1', () => {
      expect(workDays('2026-06-08', '2026-06-08')).toBe(1);
    });

    it('yıl sonu → yeni yıl geçişi doğru hesaplar', () => {
      // 2026-12-28 Pzt, 29 Sal, 30 Çar, 31 Per → 4 gün
      // 2027-01-01 Cum = tatil, 02 Cmt = hafta sonu, 03 Paz = hafta sonu, 04 Pzt → 1 gün
      // Toplam: 5 iş günü
      const holidays = new Set(['2027-01-01']);
      expect(workDays('2026-12-28', '2027-01-04', holidays)).toBe(5);
    });
  });
});
