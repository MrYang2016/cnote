/**
 * Chat messages database operations
 */

import { createClient } from '@/lib/supabase/server';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * Get chat messages for a user
 * @param userId - User ID
 * @param limit - Maximum number of messages to retrieve
 */
export async function getChatMessages(
  userId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error('Failed to fetch chat messages');
  }

  return data || [];
}

/**
 * Save a chat message
 */
export async function saveChatMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      role,
      content,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error saving chat message:', error);
    throw new Error('Failed to save chat message');
  }

  return data;
}

/**
 * Delete all chat messages for a user
 */
export async function clearChatHistory(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing chat history:', error);
    throw new Error('Failed to clear chat history');
  }
}

/**
 * Get recent chat messages (last N messages)
 */
export async function getRecentChatMessages(
  userId: string,
  count: number = 10
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(count);

  if (error) {
    console.error('Error fetching recent chat messages:', error);
    throw new Error('Failed to fetch recent chat messages');
  }

  // Reverse to get chronological order
  return (data || []).reverse();
}

