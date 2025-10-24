/**
 * Notes database operations
 */

import { createClient } from '@/lib/supabase/server';
import type { Note, NoteWithOwner } from '@/lib/utils/types';
import { NotFoundError } from '@/lib/utils/errors';

/**
 * Get all notes for a user
 */
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }

  return data || [];
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string, userId: string): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Note not found');
  }

  return data;
}

/**
 * Get a single note by ID (including shared notes)
 * This function checks if the user owns the note or has been shared access to it
 */
export async function getNoteWithAccess(noteId: string, userId: string): Promise<NoteWithOwner> {
  const supabase = await createClient();

  // First check if user owns the note
  const { data: ownedNote, error: ownedError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (ownedNote && !ownedError) {
    return ownedNote;
  }

  // If not owned, check if user has shared access
  const { data: sharedNote, error: sharedError } = await supabase
    .from('notes')
    .select(`
      *,
      note_shares!inner(
        permission,
        shared_with_user_id
      ),
      owner:profiles!notes_user_id_fkey(
        username,
        display_name
      )
    `)
    .eq('id', noteId)
    .eq('note_shares.shared_with_user_id', userId)
    .single();

  if (sharedError || !sharedNote) {
    throw new NotFoundError('Note not found or access denied');
  }

  return sharedNote;
}

/**
 * Create a new note
 */
export async function createNote(
  userId: string,
  title: string,
  content: string,
  isShared: boolean = false
): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content,
      is_shared: isShared,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }

  return data;
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  userId: string,
  updates: { title?: string; content?: string; is_shared?: boolean }
): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new NotFoundError('Note not found or unauthorized');
  }

  return data;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new NotFoundError('Note not found or unauthorized');
  }
}

