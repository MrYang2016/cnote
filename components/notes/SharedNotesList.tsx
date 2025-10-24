'use client'

/**
 * 共享笔记列表组件
 * Phase 3
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Edit } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface SharedNote {
  note_id: string
  title: string
  content: string
  permission: 'read' | 'write'
  owner_username: string
  owner_display_name: string
  created_at: string
  updated_at: string
}

export function SharedNotesList() {
  const router = useRouter()
  const [notes, setNotes] = useState<SharedNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSharedNotes()
  }, [])

  const fetchSharedNotes = async () => {
    try {
      const res = await fetch('/api/shares?type=shared-with-me')
      const data = await res.json()

      if (res.ok) {
        setNotes(data.sharedNotes || [])
      } else {
        toast.error(data.error || 'Failed to load shared notes')
      }
    } catch (error) {
      console.error('Error fetching shared notes:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteClick = (noteId: string) => {
    router.push(`/notes/${noteId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No shared notes yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Notes shared with you by friends will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card
          key={note.note_id}
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleNoteClick(note.note_id)}
        >
          <div className="space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold truncate">{note.title}</h3>
                {note.permission === 'read' ? (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Edit className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.content}
              </p>
            </div>

            <div className="border-t pt-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                Shared by <span className="font-medium">{note.owner_display_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {note.permission === 'read' ? 'Read only' : 'Can edit'}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

