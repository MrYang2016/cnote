/**
 * Delete Note Dialog Component
 * Confirmation dialog for deleting a note
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface DeleteNoteDialogProps {
  noteId: string;
  noteTitle: string;
}

export function DeleteNoteDialog({ noteId, noteTitle }: DeleteNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }

      toast.success('Note deleted successfully');
      setOpen(false);
      router.push('/notes');
      router.refresh();
    } catch (error) {
      console.error('Error deleting note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="cursor-pointer">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{noteTitle}&rdquo;? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="cursor-pointer">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

