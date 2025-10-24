/**
 * Chat API Route
 * POST: Send a message and get AI response with context from notes
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getChatMessages, saveChatMessage } from '@/lib/db/chat';
import { searchSimilarNotes } from '@/lib/db/embeddings';
import { generateEmbedding } from '@/lib/embeddings/doubao';
import { generateChatCompletion } from '@/lib/llm/deepseek';
import { handleError } from '@/lib/utils/errors';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = chatSchema.parse(body);

    // Save user message
    await saveChatMessage(user.id, 'user', message);

    // Get recent chat history for context
    const recentMessages = await getChatMessages(user.id, 10);

    // Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message);

    // Search for relevant notes
    const relevantNotes = await searchSimilarNotes(
      user.id,
      queryEmbedding,
      3, // Top 3 most relevant chunks
      0.5 // Similarity threshold
    );

    // Build context from relevant notes (includes shared notes)
    let context = '';
    if (relevantNotes.length > 0) {
      context = 'Relevant information from notes:\n\n';
      relevantNotes.forEach((result, index) => {
        const noteOwner = result.is_own_note
          ? 'Your note'
          : `Shared by @${result.owner_username}`;
        context += `[${index + 1}] ${noteOwner} - "${result.note?.title || 'Untitled'}":\n${result.chunk_text}\n\n`;
      });
    }

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for a note-taking application. 
You have access to the user's personal notes AND notes that have been shared with them by friends.
You can help them find information, answer questions, and provide insights based on both their own notes and shared notes.

${context ? `Here is some context from notes (personal and shared) that might be relevant:\n\n${context}` : 'No relevant notes found for this query.'}

When answering:
- Be concise and helpful
- Reference specific notes when applicable
- Clearly indicate if information comes from a shared note (e.g., "According to a note shared by @username...")
- If you don't have enough information in the notes, say so
- Provide actionable suggestions when appropriate`;

    // Prepare messages for LLM (exclude system messages from history)
    const chatHistory = recentMessages
      .filter((msg) => msg.role !== 'system')
      .slice(-6) // Last 6 messages for context
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Generate AI response
    const aiResponse = await generateChatCompletion(chatHistory, systemPrompt);

    // Save assistant message
    await saveChatMessage(user.id, 'assistant', aiResponse);

    return NextResponse.json({
      message: aiResponse,
      context: relevantNotes.map((note) => ({
        noteId: note.note_id,
        title: note.note?.title,
        similarity: note.similarity,
        isOwnNote: note.is_own_note,
        ownerUsername: note.owner_username,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * GET /api/chat
 * Get chat history
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await getChatMessages(user.id);

    return NextResponse.json({ messages });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * DELETE /api/chat
 * Clear chat history
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clearChatHistory } = await import('@/lib/db/chat');
    await clearChatHistory(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

