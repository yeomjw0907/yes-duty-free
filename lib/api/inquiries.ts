import { getSupabase } from '../supabase';

export interface InquiryRow {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'pending' | 'answered' | 'closed';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export async function createInquiry(userId: string, input: { subject: string; message: string }): Promise<InquiryRow> {
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) throw new Error('제목과 내용을 입력해 주세요.');

  const { data, error } = await getSupabase()
    .from('inquiries')
    .insert({ user_id: userId, subject, message, status: 'pending' })
    .select('*')
    .single();

  if (error || !data) {
    console.error('createInquiry error:', error);
    throw error ?? new Error('문의 등록에 실패했습니다.');
  }
  return data as InquiryRow;
}

export async function getMyInquiries(userId: string): Promise<InquiryRow[]> {
  const { data, error } = await getSupabase()
    .from('inquiries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyInquiries error:', error);
    throw error;
  }
  return (data ?? []) as InquiryRow[];
}

export async function getAllInquiries(): Promise<InquiryRow[]> {
  const { data, error } = await getSupabase().from('inquiries').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('getAllInquiries error:', error);
    throw error;
  }
  return (data ?? []) as InquiryRow[];
}

export async function replyToInquiry(inquiryId: string, input: { adminReply: string; status?: InquiryRow['status'] }): Promise<void> {
  const adminReply = input.adminReply.trim();
  if (!adminReply) throw new Error('답변 내용을 입력해 주세요.');
  const status = input.status ?? 'answered';

  const { error } = await getSupabase()
    .from('inquiries')
    .update({ admin_reply: adminReply, status, replied_at: new Date().toISOString() })
    .eq('id', inquiryId);

  if (error) {
    console.error('replyToInquiry error:', error);
    throw error;
  }
}

