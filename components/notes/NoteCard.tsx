/**
 * Note Card Component
 * Displays a single note in a card format
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note } from '@/lib/utils/types';
import { FileText, Lock, Users, Loader2 } from 'lucide-react';
import { stripMarkdown } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Strip markdown syntax for preview
  const plainText = stripMarkdown(note.content);
  const truncatedContent = plainText.length > 150
    ? plainText.substring(0, 150) + '...'
    : plainText;

  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleClick = async () => {
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    try {
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer h-full ${isLoading ? 'opacity-75 pointer-events-none' : ''
        }`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {note.title}
            </CardTitle>
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
  );
}

