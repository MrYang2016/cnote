/**
 * Single Note Page
 * View and edit a specific note
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getNote } from '@/lib/db/notes';
import { getNoteShares } from '@/lib/db/shares';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { DeleteNoteDialog } from '@/components/notes/DeleteNoteDialog';
import { ShareNoteDialog } from '@/components/notes/ShareNoteDialog';
import { Separator } from '@/components/ui/separator';

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let note;
  try {
    note = await getNote(id, user.id);
  } catch {
    notFound();
  }

  // 获取笔记的共享信息
  const shares = await getNoteShares(id);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Note</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {new Date(note.updated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3 items-start">
          <ShareNoteDialog noteId={note.id} currentShares={shares} />
          <DeleteNoteDialog noteId={note.id} noteTitle={note.title} />
        </div>
      </div>
      <Separator />
      <NoteEditor note={note} />
    </div>
  );
}

