/**
 * Message Bubble Component
 * Individual chat message display
 */

'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return null; // Don't display system messages
  }

  return (
    <div
      className={cn(
        'flex gap-3 items-start',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
              : 'bg-muted'
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  // Custom styling for code blocks
                  code: ({ children, ...props }: any) => {
                    const isInline = !props.className?.includes('language-');
                    if (isInline) {
                      return (
                        <code
                          className="bg-muted-foreground/10 px-1 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto">
                        <code className="text-sm font-mono" {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  // Custom styling for links
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline cursor-pointer"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  // Custom styling for lists
                  ul: ({ children, ...props }) => (
                    <ul className="list-disc list-inside space-y-1" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="list-decimal list-inside space-y-1" {...props}>
                      {children}
                    </ol>
                  ),
                  // Custom styling for blockquotes
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

