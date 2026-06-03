// Tatil günleri önbelleği — API'dan yıl bazlı çeker, bellekte tutar

interface HolidayRow { date: string; name: string; is_half_day: boolean; }

const _sets:  Map<number, Set<string>>          = new Map();
const _names: Map<number, Map<string, string>>  = new Map();
const _loading: Set<number>                      = new Set();

async function _fetch(year: number): Promise<void> {
  if (_sets.has(year) || _loading.has(year)) return;
  _loading.add(year);
  try {
    const res  = await fetch(`/api/v1/holidays?year=${year}`, { credentials: 'include' });
    const data = await res.json() as { rows: HolidayRow[] };
    const rows = data.rows ?? [];
    _sets.set(year,  new Set(rows.map(h => h.date)));
    _names.set(year, new Map(rows.map(h => [h.date, h.name])));
  } catch {
    _sets.set(year,  new Set());
    _names.set(year, new Map());
  } finally {
    _loading.delete(year);
  }
}

/** Yılın tatil günleri seti — '2026-01-01' formatında */
export async function getHolidaySet(year: number): Promise<Set<string>> {
  await _fetch(year);
  return _sets.get(year) ?? new Set();
}

/** Yılın tatil adları map'i — tarih → isim */
export async function getHolidayNames(year: number): Promise<Map<string, string>> {
  await _fetch(year);
  return _names.get(year) ?? new Map();
}

/** Birden fazla yılı önceden yükle */
export async function preload(years: number[]): Promise<void> {
  await Promise.all(years.map(_fetch));
}

/** Önbellekten senkron erişim (önceden yüklendiyse) */
export function getHolidaySetSync(year: number): Set<string> {
  return _sets.get(year) ?? new Set();
}
export function getHolidayNamesSync(year: number): Map<string, string> {
  return _names.get(year) ?? new Map();
}
