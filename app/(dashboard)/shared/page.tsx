/**
 * 共享笔记页面
 * Phase 3
 */

import { Metadata } from 'next'
import { SharedNotesList } from '@/components/notes/SharedNotesList'

export const metadata: Metadata = {
  title: 'Shared Notes | AI Note System',
  description: 'Notes shared with you by friends',
}

export default function SharedNotesPage() {
  return (
    <div className="container max-w-6xl py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Shared with Me</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Notes shared with you by your friends
        </p>
      </div>
      <SharedNotesList />
    </div>
  )
}

