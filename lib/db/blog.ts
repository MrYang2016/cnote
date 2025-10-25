/**
 * Blog database operations
 */

import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/lib/utils/types';

export interface BlogPost extends Note {
  author: {
    username: string;
    display_name: string | null;
  };
}

/**
 * Get all blog posts for a user
 */
export async function getBlogPosts(username: string): Promise<BlogPost[]> {
  const supabase = await createClient();

  // First get the user by username
  const user = await getUserByUsername(username);
  if (!user) {
    return [];
  }

  // Then get blog posts for that user
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      author:profiles!notes_user_id_fkey(
        username,
        display_name
      )
    `)
    .eq('in_blog', true)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw new Error('Failed to fetch blog posts');
  }

  return data || [];
}

/**
 * Get a single blog post by ID (public access)
 */
export async function getBlogPost(noteId: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      author:profiles!notes_user_id_fkey(
        username,
        display_name
      )
    `)
    .eq('id', noteId)
    .eq('in_blog', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Add a note to blog
 */
export async function addNoteToBlog(noteId: string, userId: string): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .update({ in_blog: true })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to add note to blog');
  }

  return data;
}

/**
 * Remove a note from blog
 */
export async function removeNoteFromBlog(noteId: string, userId: string): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .update({ in_blog: false })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to remove note from blog');
  }

  return data;
}

/**
 * Check if username exists
 */
export async function getUserByUsername(username: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

