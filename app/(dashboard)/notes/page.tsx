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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your notes with AI-powered search
          </p>
        </div>
        <NewNoteButton />
      </div>

      <NotesList notes={notes} />
    </div>
  );
}
