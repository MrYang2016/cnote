/**
 * Note Card Component
 * Displays a single note in a card format
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note } from '@/lib/utils/types';
import { FileText, Lock, Users } from 'lucide-react';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const truncatedContent = note.content.length > 150
    ? note.content.substring(0, 150) + '...'
    : note.content;

  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="line-clamp-1">{note.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <FileText className="w-3 h-3" />
                <span>{formattedDate}</span>
                <span className="flex items-center gap-1 ml-2">
                  {note.is_shared ? (
                    <>
                      <Users className="w-3 h-3" />
                      <span className="text-xs">Shared</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span className="text-xs">Private</span>
                    </>
                  )}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncatedContent || 'No content'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

