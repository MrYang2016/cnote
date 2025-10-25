/**
 * Markdown Editor Component
 * Rich text editor with markdown support
 */

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import '@uiw/react-md-editor/markdown-editor.css';

// Dynamically import the editor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border rounded-md flex items-center justify-center text-muted-foreground">
      Loading editor...
    </div>
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your note here...',
  disabled = false,
  className,
}: MarkdownEditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleChange = (val: string | undefined) => {
    setEditorValue(val || '');
    onChange(val);
  };

  return (
    <div className={cn('w-full', className)} data-color-mode="light">
      <MDEditor
        value={editorValue}
        onChange={handleChange}
        preview="edit"
        hideToolbar={disabled}
        visibleDragbar={false}
        height={400}
        textareaProps={{
          placeholder,
          disabled,
          style: {
            fontSize: 14,
            padding: '16px',
          },
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
    </div>
  );
}

