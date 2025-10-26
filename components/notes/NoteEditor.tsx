/**
 * Note Editor Component
 * Form for creating and editing notes
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Note } from '@/lib/utils/types';
import { Save, ArrowLeft, BookOpen, Eye, Edit, Loader2 } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

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
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  // Default to preview mode for readonly, edit mode for editable
  const [editMode, setEditMode] = useState(canEdit);
  const router = useRouter();

  const handleBackClick = async () => {
    if (isNavigatingBack) return; // Prevent multiple clicks

    setIsNavigatingBack(true);
    try {
      router.push('/notes');
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigatingBack(false);
    }
  };

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
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg md:text-xl">{note ? 'Edit Note' : 'Create New Note'}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            disabled={isNavigatingBack}
            className={`cursor-pointer ${isNavigatingBack ? 'opacity-75' : ''}`}
          >
            {isNavigatingBack ? (
              <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Back</span>
          </Button>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant={!editMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditMode(false)}
                    className="cursor-pointer"
                  >
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                </div>
              )}
            </div>
            {canEdit && editMode ? (
              <MarkdownEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                placeholder="Write your note here... You can use markdown syntax for formatting, code blocks, images, etc."
                disabled={saving}
              />
            ) : (
              <div className="min-h-[300px] md:min-h-[400px] p-3 md:p-4 border rounded-md bg-card prose prose-sm max-w-none dark:prose-invert overflow-x-auto">
                {content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">No content yet...</p>
                )}
              </div>
            )}
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
                  className="rounded cursor-pointer"
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
                  className="rounded cursor-pointer"
                />
                <label htmlFor="in_blog" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Publish as blog post
                </label>
              </div>
            </div>
          )}

          {canEdit && (
            <Button type="submit" disabled={saving} className="w-full cursor-pointer">
              <Save className="w-4 h-4 sm:mr-2" />
              {saving ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

