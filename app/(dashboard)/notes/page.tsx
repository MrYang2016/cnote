/**
 * Notes List Page
 * Displays all notes for the authenticated user
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getNotes } from '@/lib/db/notes';
import { NotesList } from '@/components/notes/NotesList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
        <Link href="/notes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>

      <NotesList notes={notes} />
    </div>
  );
}
