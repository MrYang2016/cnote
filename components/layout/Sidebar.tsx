/**
 * Sidebar Component
 * Navigation sidebar for the app
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, MessageSquare, Users, Share2 } from 'lucide-react';

const navigation = [
  {
    name: 'Notes',
    href: '/notes',
    icon: FileText,
    description: 'Manage your notes',
  },
  {
    name: 'Shared',
    href: '/shared',
    icon: Share2,
    description: 'Notes shared with you',
    disabled: false,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'AI Assistant',
    disabled: false,
  },
  {
    name: 'Friends',
    href: '/friends',
    icon: Users,
    description: 'Manage friends',
    disabled: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : item.disabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-foreground hover:bg-accent'
              )}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                }
              }}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <div>{item.name}</div>
                {item.disabled && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

