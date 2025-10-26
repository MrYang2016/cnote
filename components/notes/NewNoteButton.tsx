/**
 * New Note Button Component
 * Button with loading state for creating new notes
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export function NewNoteButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    try {
      router.push('/notes/new');
    } catch (error) {
      console.error('Navigation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`cursor-pointer ${isLoading ? 'opacity-75' : ''}`}
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          <span className="hidden sm:inline">Creating...</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Note</span>
        </>
      )}
    </Button>
  );
}
