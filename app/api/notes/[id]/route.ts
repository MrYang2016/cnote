/**
 * Single note API route
 * GET: Get a single note
 * PATCH: Update a note
 * DELETE: Delete a note
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getNoteWithAccess, updateNote, deleteNote } from '@/lib/db/notes';
import { updateNoteEmbeddings } from '@/lib/embeddings/vectorize';
import { deleteNoteEmbeddings } from '@/lib/db/embeddings';
import { handleError } from '@/lib/utils/errors';
import { z } from 'zod';

// Schema for updating a note
const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().optional(),
  is_shared: z.boolean().optional(),
  in_blog: z.boolean().optional(),
});

/**
 * GET /api/notes/[id]
 * Get a single note
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await getNoteWithAccess(id, user.id);

    return NextResponse.json({ note });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * PATCH /api/notes/[id]
 * Update a note and regenerate embeddings if content changed
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Update the note
    const updatedNote = await updateNote(id, user.id, validatedData);

    // If title or content changed, regenerate embeddings
    if (validatedData.title !== undefined || validatedData.content !== undefined) {
      updateNoteEmbeddings(updatedNote).catch((error) => {
        console.error('Error regenerating embeddings:', error);
      });
    }

    return NextResponse.json({ note: updatedNote });
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
 * DELETE /api/notes/[id]
 * Delete a note and its embeddings
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete embeddings first (will cascade, but explicit is better)
    await deleteNoteEmbeddings(id);

    // Delete the note
    await deleteNote(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

