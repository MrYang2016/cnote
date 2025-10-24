/**
 * Doubao (Volcano Engine) Embedding API client
 */

import OpenAI from 'openai';

// Initialize Doubao client (using OpenAI SDK with custom base URL)
const doubao = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY!,
  baseURL: process.env.DOUBAO_BASE_URL!,
});

/**
 * Generate embedding for a single text using Doubao
 * @param text - The text to embed
 * @returns Embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await doubao.embeddings.create({
      model: 'doubao-embedding-text-240715',
      input: text,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from Doubao API');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Process in batches to avoid rate limits
    const batchSize = 10;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await doubao.embeddings.create({
        model: 'doubao-embedding-text-240715',
        input: batch,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from Doubao API');
      }

      // Sort by index to ensure correct order
      const sortedData = response.data.sort((a, b) => a.index - b.index);
      embeddings.push(...sortedData.map((item) => item.embedding));
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

