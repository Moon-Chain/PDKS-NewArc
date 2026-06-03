export interface LeaveRow {
  id:              string;
  company_id:      string;
  user_id:         string;
  user_name:       string;
  manager_id:      string;
  start_date:      string;
  end_date:        string;
  days:            number;
  reason:          string;
  type:            'annual' | 'report' | 'excuse';
  attachment_path: string | null;
  status:          'pending' | 'approved' | 'rejected';
  is_deleted:      boolean;
  deleted_at:      string | null;
  delete_reason:   string | null;
  deleted_by:      string | null;
  updated_at:      string;
  created_at:      string;
}
