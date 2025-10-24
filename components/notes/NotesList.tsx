/**
 * Notes List Component
 * Displays a grid of note cards
 */

'use client';

import { NoteCard } from './NoteCard';
import type { Note } from '@/lib/utils/types';
import { FileText } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
        <p className="text-muted-foreground">
          Create your first note to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}

