/**
 * Note Editor Component
 * Form for creating and editing notes
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Note } from '@/lib/utils/types';
import { Save, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface NoteEditorProps {
  note?: Note;
  onSave?: (note: Note) => void;
  canEdit?: boolean;
}

export function NoteEditor({ note, onSave, canEdit = true }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isShared, setIsShared] = useState(note?.is_shared || false);
  const [inBlog, setInBlog] = useState(note?.in_blog || false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);

    try {
      if (note) {
        // Update existing note
        const response = await fetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, is_shared: isShared, in_blog: inBlog }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update note');
        }

        const data = await response.json();
        toast.success('Note updated successfully');

        if (onSave) {
          onSave(data.note);
        }
      } else {
        // Create new note
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, is_shared: isShared, in_blog: inBlog }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create note');
        }

        const data = await response.json();
        toast.success('Note created successfully');
        router.push(`/notes/${data.note.id}`);
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save note';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{note ? 'Edit Note' : 'Create New Note'}</CardTitle>
          <Link href="/notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving || !canEdit}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving || !canEdit}
              rows={15}
              className="resize-none"
            />
          </div>

          {canEdit && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  id="is_shared"
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  disabled={saving}
                  className="rounded"
                />
                <label htmlFor="is_shared" className="text-sm font-medium cursor-pointer">
                  Share this note with friends
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="in_blog"
                  type="checkbox"
                  checked={inBlog}
                  onChange={(e) => setInBlog(e.target.checked)}
                  disabled={saving}
                  className="rounded"
                />
                <label htmlFor="in_blog" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Publish as blog post
                </label>
              </div>
            </div>
          )}

          {canEdit && (
            <Button type="submit" disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

