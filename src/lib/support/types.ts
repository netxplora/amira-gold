export type SupportTicketStatus = 'pending' | 'active' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent' | 'VIP';
export type SupportDepartmentType = 'payments' | 'vaults' | 'shipping' | 'jewelry' | 'KYC' | 'investments' | 'technical_support';

export interface SupportDepartment {
  id: string;
  name: SupportDepartmentType;
  description: string;
  created_at: string;
}

export interface SupportAgent {
  id: string;
  user_id: string;
  department_id: string | null;
  status: 'online' | 'busy' | 'offline';
  last_seen_at: string;
  max_tickets: number;
  active_tickets: number;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportPriority;
  department_id: string | null;
  assigned_to: string | null;
  metadata: Record<string, any>;
  last_message_at: string;
  closed_at: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string;
  };
  department?: SupportDepartment;
  agent?: SupportAgent;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin' | 'system';
  content: string;
  type: 'text' | 'image' | 'document' | 'system';
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  message_id: string | null;
  ticket_id: string | null;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface SupportActivityLog {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportNotification {
  id: string;
  user_id: string;
  ticket_id: string | null;
  message_id: string | null;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
