/**
 * Text chunking utilities for embeddings
 */

import type { TextChunk } from '@/lib/utils/types';

/**
 * Split text into overlapping chunks
 * @param text - The text to chunk
 * @param chunkSize - Size of each chunk in characters (default: 500)
 * @param overlap - Number of overlapping characters between chunks (default: 50)
 * @returns Array of text chunks with indices
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  // Remove extra whitespace and normalize
  const cleanText = text.trim().replace(/\s+/g, ' ');

  // If text is shorter than chunk size, return as single chunk
  if (cleanText.length <= chunkSize) {
    return [{ text: cleanText, index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    // Calculate end index
    let endIndex = startIndex + chunkSize;

    // If this is not the last chunk, try to break at a word boundary
    if (endIndex < cleanText.length) {
      // Look for the last space within the chunk
      const lastSpaceIndex = cleanText.lastIndexOf(' ', endIndex);
      
      // If we found a space and it's not too far back, use it
      if (lastSpaceIndex > startIndex + chunkSize / 2) {
        endIndex = lastSpaceIndex;
      }
    } else {
      // This is the last chunk, include everything
      endIndex = cleanText.length;
    }

    // Extract chunk
    const chunkText = cleanText.substring(startIndex, endIndex).trim();
    
    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
      });
      chunkIndex++;
    }

    // Move start index for next chunk (with overlap)
    startIndex = endIndex - overlap;

    // Prevent infinite loop
    if (startIndex <= endIndex - chunkSize && endIndex >= cleanText.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Combine note title and content for chunking
 */
export function prepareNoteForChunking(title: string, content: string): string {
  return `${title}\n\n${content}`;
}

