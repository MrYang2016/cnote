/**
 * Notes API route
 * GET: List all notes for the authenticated user
 * POST: Create a new note
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getNotes, createNote } from '@/lib/db/notes';
import { updateNoteEmbeddings } from '@/lib/embeddings/vectorize';
import { handleError } from '@/lib/utils/errors';
import { z } from 'zod';

// Schema for creating a note
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string(),
  is_shared: z.boolean().optional().default(false),
});

/**
 * GET /api/notes
 * List all notes for the authenticated user
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

    const notes = await getNotes(user.id);

    return NextResponse.json({ notes });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * POST /api/notes
 * Create a new note and generate embeddings
 */
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
    const validatedData = createNoteSchema.parse(body);

    // Create the note
    const note = await createNote(
      user.id,
      validatedData.title,
      validatedData.content,
      validatedData.is_shared
    );

    // Generate embeddings asynchronously (don't wait)
    // This runs in the background to avoid blocking the response
    updateNoteEmbeddings(note).catch((error) => {
      console.error('Error generating embeddings:', error);
    });

    return NextResponse.json({ note }, { status: 201 });
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

