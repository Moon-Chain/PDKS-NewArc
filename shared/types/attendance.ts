export interface AttendanceRow {
  id:             string;
  company_id:     string;
  user_id:        string;
  user_name:      string;
  type:           'in' | 'out';
  timestamp:      string;
  ip_address:     string | null;
  status:         'success' | 'error' | 'pending';
  error_message:  string | null;
  latitude:       number | null;
  longitude:      number | null;
  is_remote:      boolean;
  remote_note:    string | null;
  manual_entry:   boolean;
  offline_queued: boolean;
  is_deleted:     boolean;
  deleted_at:     string | null;
  deleted_by:     string | null;
  updated_at:     string;
  created_at:     string;
}

export interface AttendanceStatus {
  isInside:   boolean;
  lastEntry:  AttendanceRow | null;
  cooldownMs: number;  // ms cinsinden kalan cooldown süresi (0 ise aktif)
}
