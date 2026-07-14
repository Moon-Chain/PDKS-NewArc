export function errMsg(err: unknown, context: string): string {
  if (err instanceof Error) {
    const m = err.message.trim();
    if (m === 'Failed to fetch' || m.startsWith('NetworkError'))
      return 'Sunucuya bağlanılamadı — internet bağlantınızı kontrol edin.';
    if (m && m !== 'Sunucu hatası') return m;
  }
  return context;
}
