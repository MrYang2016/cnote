/**
 * Notes List Page
 * Displays all notes for the authenticated user
 */

import { createClient } from '@/lib/supabase/server';
import { getNotes } from '@/lib/db/notes';
import { NotesList } from '@/components/notes/NotesList';
import { NewNoteButton } from '@/components/notes/NewNoteButton';

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const notes = await getNotes(user.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage and organize your notes with AI-powered search
          </p>
        </div>
        <NewNoteButton />
      </div>

      <NotesList notes={notes} />
    </div>
  );
}
