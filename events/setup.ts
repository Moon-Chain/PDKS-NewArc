import { emitter } from './emitter.js';
import { logger } from '../core/Logger.js';
import { notificationService } from '../services/NotificationService.js';

// Karşılıksız hata → sunucuyu çökertmesin
emitter.on('error', (err: Error) => {
  logger.error('emitter_error', { message: err.message });
});

// İzin talebi → yöneticiye bildirim
emitter.on('leave:requested', async (data: {
  companyId: string;
  managerId: string;
  userId:    string;
  userName:  string;
  leaveId:   string;
  days:      number;
  type:      string;
}) => {
  const typeLabel: Record<string, string> = {
    annual:  'Yıllık İzin',
    report:  'Rapor',
    excuse:  'Mazeret İzni',
  };
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.managerId,
    title:     'Yeni İzin Talebi',
    message:   `${data.userName} ${data.days} günlük ${typeLabel[data.type] ?? 'izin'} talep etti.`,
    type:      'info',
    link:      '/approvals',
  }).catch(err => logger.error('notif_leave_requested', { error: err.message }));
});

// İzin onaylandı → personele bildirim
emitter.on('leave:approved', async (data: {
  companyId:    string;
  userId:       string;
  approverName: string;
  leaveId:      string;
  days:         number;
}) => {
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.userId,
    title:     'İzin Talebiniz Onaylandı',
    message:   `${data.days} günlük izin talebiniz onaylandı.`,
    type:      'success',
    link:      '/leaves',
  }).catch(err => logger.error('notif_leave_approved', { error: err.message }));
});

// İzin reddedildi → personele bildirim
emitter.on('leave:rejected', async (data: {
  companyId:    string;
  userId:       string;
  approverName: string;
  leaveId:      string;
}) => {
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.userId,
    title:     'İzin Talebiniz Reddedildi',
    message:   'İzin talebiniz reddedildi. Detaylar için izinler sayfasını inceleyin.',
    type:      'error',
    link:      '/leaves',
  }).catch(err => logger.error('notif_leave_rejected', { error: err.message }));
});

// Mesai talebi → yöneticiye bildirim
emitter.on('overtime:requested', async (data: {
  companyId: string;
  managerId: string;
  userId:    string;
  userName:  string;
  overtimeId: string;
  hours:     number;
  date:      string;
}) => {
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.managerId,
    title:     'Yeni Mesai Talebi',
    message:   `${data.userName} ${data.date} tarihinde ${data.hours} saatlik mesai talep etti.`,
    type:      'info',
    link:      '/approvals',
  }).catch(err => logger.error('notif_overtime_requested', { error: err.message }));
});

// Mesai onaylandı → personele bildirim
emitter.on('overtime:approved', async (data: {
  companyId:  string;
  userId:     string;
  overtimeId: string;
  hours:      number;
}) => {
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.userId,
    title:     'Mesai Talebiniz Onaylandı',
    message:   `${data.hours} saatlik mesai talebiniz onaylandı.`,
    type:      'success',
    link:      '/leaves',
  }).catch(err => logger.error('notif_overtime_approved', { error: err.message }));
});

// Mesai reddedildi → personele bildirim
emitter.on('overtime:rejected', async (data: {
  companyId:  string;
  userId:     string;
  overtimeId: string;
}) => {
  await notificationService.notify({
    companyId: data.companyId,
    userId:    data.userId,
    title:     'Mesai Talebiniz Reddedildi',
    message:   'Mesai talebiniz reddedildi. Detaylar için izinler sayfasını inceleyin.',
    type:      'error',
    link:      '/leaves',
  }).catch(err => logger.error('notif_overtime_rejected', { error: err.message }));
});

logger.info('Event emitter hazır (bildirim sistemi aktif)');
