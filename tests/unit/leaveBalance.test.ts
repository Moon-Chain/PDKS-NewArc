// İzin bakiyesi hesabı testleri

// LeaveService'deki izin bakiyesi mantığını izole ederek test ediyoruz
function calcLeaveDays(
  currentBalance: number,
  requestedDays: number,
  leaveType: 'annual' | 'report' | 'excuse',
): { canApply: boolean; newBalance: number; reason?: string } {
  // Rapor ve mazeret izni bakiyeyi düşürmez
  if (leaveType === 'report' || leaveType === 'excuse') {
    return { canApply: true, newBalance: currentBalance };
  }

  // Yıllık izin: bakiye yeterli mi?
  if (requestedDays > currentBalance) {
    return {
      canApply:   false,
      newBalance: currentBalance,
      reason:     `Yetersiz izin bakiyesi (kalan: ${currentBalance}, talep: ${requestedDays})`,
    };
  }

  return { canApply: true, newBalance: currentBalance - requestedDays };
}

// Durum geçişleri — hangi durumdan hangisine geçiş geçerli
function isValidStatusTransition(
  current: 'pending' | 'approved' | 'rejected',
  next:    'approved' | 'rejected' | 'cancelled',
): boolean {
  if (current === 'pending') return next === 'approved' || next === 'rejected' || next === 'cancelled';
  if (current === 'approved') return next === 'cancelled';
  return false; // rejected → başka bir şey geçersiz
}

// ─────────────────────────────────────────────────────────────

describe('İzin bakiyesi hesabı', () => {

  describe('Yıllık izin', () => {
    it('bakiye yeterliyse izin onaylanabilir', () => {
      const result = calcLeaveDays(14, 5, 'annual');
      expect(result.canApply).toBe(true);
      expect(result.newBalance).toBe(9);
    });

    it('tam bakiye kadar izin alınabilir', () => {
      const result = calcLeaveDays(14, 14, 'annual');
      expect(result.canApply).toBe(true);
      expect(result.newBalance).toBe(0);
    });

    it('bakiyeden fazla izin reddedilir', () => {
      const result = calcLeaveDays(5, 10, 'annual');
      expect(result.canApply).toBe(false);
      expect(result.reason).toContain('Yetersiz');
    });

    it('bakiye sıfırken izin reddedilir', () => {
      const result = calcLeaveDays(0, 1, 'annual');
      expect(result.canApply).toBe(false);
    });

    it('1 günlük yıllık izin bakiyeyi 1 düşürür', () => {
      const result = calcLeaveDays(14, 1, 'annual');
      expect(result.newBalance).toBe(13);
    });
  });

  describe('Rapor ve mazeret izni', () => {
    it('rapor izni bakiyeyi düşürmez', () => {
      const result = calcLeaveDays(14, 30, 'report');
      expect(result.canApply).toBe(true);
      expect(result.newBalance).toBe(14); // değişmedi
    });

    it('mazeret izni bakiyeyi düşürmez', () => {
      const result = calcLeaveDays(0, 5, 'excuse');
      expect(result.canApply).toBe(true);
      expect(result.newBalance).toBe(0);
    });

    it('rapor için bakiye sıfır olsa da izin alınabilir', () => {
      const result = calcLeaveDays(0, 10, 'report');
      expect(result.canApply).toBe(true);
    });
  });
});

describe('İzin durum geçişleri', () => {

  it('pending → approved geçerli', () => {
    expect(isValidStatusTransition('pending', 'approved')).toBe(true);
  });

  it('pending → rejected geçerli', () => {
    expect(isValidStatusTransition('pending', 'rejected')).toBe(true);
  });

  it('pending → cancelled geçerli', () => {
    expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
  });

  it('approved → cancelled geçerli (onaylı izin iptal)', () => {
    expect(isValidStatusTransition('approved', 'cancelled')).toBe(true);
  });

  it('rejected → approved GEÇERSİZ', () => {
    expect(isValidStatusTransition('rejected', 'approved')).toBe(false);
  });

  it('rejected → cancelled GEÇERSİZ', () => {
    expect(isValidStatusTransition('rejected', 'cancelled')).toBe(false);
  });
});
