/**
 * Main vectorization orchestrator
 * Handles the complete flow of chunking and embedding generation
 */

import { chunkText, prepareNoteForChunking } from './chunker';
import { generateEmbeddings } from './doubao';
import { deleteNoteEmbeddings, insertEmbeddings } from '@/lib/db/embeddings';
import type { Note, EmbeddingResult } from '@/lib/utils/types';

/**
 * Vectorize a note: chunk it and generate embeddings
 * @param note - The note to vectorize
 * @returns Array of embedding results
 */
export async function vectorizeNote(note: Note): Promise<EmbeddingResult[]> {
  try {
    // Prepare text for chunking
    const fullText = prepareNoteForChunking(note.title, note.content);

    // Skip if content is empty
    if (!fullText.trim()) {
      return [];
    }

    // Chunk the text
    const chunks = chunkText(fullText);

    if (chunks.length === 0) {
      return [];
    }

    // Generate embeddings for all chunks
    const texts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(texts);

    // Combine chunks with their embeddings
    const results: EmbeddingResult[] = chunks.map((chunk, index) => ({
      embedding: embeddings[index],
      text: chunk.text,
      index: chunk.index,
    }));

    return results;
  } catch (error) {
    console.error('Error vectorizing note:', error);
    throw new Error('Failed to vectorize note');
  }
}

/**
 * Update note embeddings: delete old ones and insert new ones
 * @param note - The note to update embeddings for
 */
export async function updateNoteEmbeddings(note: Note): Promise<void> {
  try {
    // Delete existing embeddings for this note
    await deleteNoteEmbeddings(note.id);

    // Generate new embeddings
    const embeddingResults = await vectorizeNote(note);

    if (embeddingResults.length === 0) {
      console.log('No embeddings generated for note:', note.id);
      return;
    }

    // Prepare embeddings for insertion
    const embeddings = embeddingResults.map((result) => ({
      chunk_text: result.text,
      embedding: result.embedding,
      chunk_index: result.index,
    }));

    // Insert new embeddings
    await insertEmbeddings(note.id, note.user_id, embeddings);

    console.log(`Successfully updated embeddings for note ${note.id}: ${embeddings.length} chunks`);
  } catch (error) {
    console.error('Error updating note embeddings:', error);
    throw error;
  }
}

