/**
 * Embeddings database operations
 */

import { createClient } from '@/lib/supabase/server';
import type { NoteEmbedding, VectorSearchResult } from '@/lib/utils/types';

/**
 * Delete all embeddings for a note
 */
export async function deleteNoteEmbeddings(noteId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('note_embeddings')
    .delete()
    .eq('note_id', noteId);

  if (error) {
    console.error('Error deleting embeddings:', error);
    throw new Error('Failed to delete embeddings');
  }
}

/**
 * Insert embeddings for a note
 */
export async function insertEmbeddings(
  noteId: string,
  userId: string,
  embeddings: Array<{
    chunk_text: string;
    embedding: number[];
    chunk_index: number;
  }>
): Promise<void> {
  const supabase = await createClient();

  const records = embeddings.map((emb) => ({
    note_id: noteId,
    user_id: userId,
    chunk_text: emb.chunk_text,
    embedding: emb.embedding,
    chunk_index: emb.chunk_index,
  }));

  const { error } = await supabase.from('note_embeddings').insert(records);

  if (error) {
    console.error('Error inserting embeddings:', error);
    throw new Error('Failed to insert embeddings');
  }
}

/**
 * Search for similar notes using vector similarity
 */
export async function searchSimilarNotes(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.5
): Promise<VectorSearchResult[]> {
  const supabase = await createClient();

  // Use RPC function for vector similarity search
  const { data, error } = await supabase.rpc('search_notes', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: limit,
    user_id: userId,
  });

  if (error) {
    console.error('Error searching similar notes:', error);
    return [];
  }

  return (data || []).map((item: {
    note_id: string;
    chunk_text: string;
    similarity: number;
    note_title?: string;
    note_content?: string;
  }) => ({
    note_id: item.note_id,
    chunk_text: item.chunk_text,
    similarity: item.similarity,
    note: item.note_title ? {
      id: item.note_id,
      title: item.note_title,
      content: item.note_content || '',
    } : undefined,
  }));
}

/**
 * Get embeddings for a specific note
 */
export async function getNoteEmbeddings(noteId: string): Promise<NoteEmbedding[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('note_embeddings')
    .select('*')
    .eq('note_id', noteId)
    .order('chunk_index');

  if (error) {
    console.error('Error fetching embeddings:', error);
    return [];
  }

  return data || [];
}

