export interface OvertimeRow {
  id:          string;
  company_id:  string;
  user_id:     string;
  user_name:   string;
  avatar_path: string | null;
  manager_id:  string;
  date:        string;
  hours:       number;
  description: string | null;
  status:      'pending' | 'approved' | 'rejected';
  is_deleted:  boolean;
  deleted_at:  string | null;
  updated_at:  string;
  created_at:  string;
}
