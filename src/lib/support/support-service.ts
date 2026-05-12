import { supabase } from "@/integrations/supabase/client";
import { 
  SupportTicket, 
  SupportMessage, 
  SupportTicketStatus, 
  SupportPriority, 
  SupportDepartmentType 
} from "./types";

export const supportService = {
  // Tickets
  async createTicket(userId: string, subject: string, departmentId?: string, priority: SupportPriority = 'medium') {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        department_id: departmentId,
        priority,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as SupportTicket;
  },

  async getTickets(userId?: string) {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user_profile:profiles(full_name, avatar_url),
        department:support_departments(*),
        agent:support_agents(*, profile:profiles(full_name, avatar_url))
      `)
      .order('last_message_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SupportTicket[];
  },

  async getTicketById(id: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user_profile:profiles(full_name, avatar_url),
        department:support_departments(*),
        agent:support_agents(*, profile:profiles(full_name, avatar_url))
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as SupportTicket;
  },

  async updateTicketStatus(id: string, status: SupportTicketStatus) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async assignTicket(id: string, agentId: string) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        assigned_to: agentId, 
        status: 'active',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Messages
  async sendMessage(ticketId: string, senderId: string, senderRole: 'user' | 'admin', content: string, type: 'text' | 'image' | 'document' = 'text', metadata = {}) {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_role: senderRole,
        content,
        type,
        metadata
      })
      .select()
      .single();
    
    if (error) throw error;

    // Update ticket's last_message_at
    await supabase
      .from('support_tickets')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', ticketId);

    return data as SupportMessage;
  },

  async getMessages(ticketId: string) {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        attachments:support_attachments(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as SupportMessage[];
  },

  // Attachments
  async uploadAttachment(ticketId: string, messageId: string | null, file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${ticketId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('support_attachments')
      .insert({
        ticket_id: ticketId,
        message_id: messageId,
        file_name: file.name,
        file_type: file.type,
        file_url: publicUrl,
        file_size: file.size,
        uploaded_by: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Departments
  async getDepartments() {
    const { data, error } = await supabase
      .from('support_departments')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(ticketId: string, userId: string) {
    const { error } = await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', ticketId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  // Notifications
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('support_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async markNotificationAsRead(id: string) {
    const { error } = await supabase
      .from('support_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }
};
