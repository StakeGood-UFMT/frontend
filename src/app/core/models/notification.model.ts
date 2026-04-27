export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'claim' | 'market';
  read: boolean;
  cta_label?: string;
  cta_link?: string;
  created_at: string;
}
