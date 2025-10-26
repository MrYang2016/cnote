/**
 * Sidebar Component
 * Navigation sidebar for the app
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, MessageSquare, Users, Share2, Loader2 } from 'lucide-react';

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

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingItems(new Set());
  }, [pathname]);

  const handleNavigation = async (href: string, itemName: string) => {
    if (loadingItems.has(itemName) || pathname === href) return;

    setLoadingItems(prev => new Set(prev).add(itemName));
    try {
      router.push(href);
      // Close mobile menu if callback provided
      if (onNavigate) {
        onNavigate();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemName);
        return newSet;
      });
    }
  };

  return (
    <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)] hidden md:block">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isLoading = loadingItems.has(item.name);
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => {
                if (!item.disabled) {
                  handleNavigation(item.href, item.name);
                }
              }}
              disabled={item.disabled || isLoading}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left',
                isActive
                  ? 'bg-primary text-primary-foreground cursor-pointer'
                  : item.disabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : isLoading
                      ? 'text-foreground opacity-75 cursor-wait'
                      : 'text-foreground hover:bg-accent cursor-pointer'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <div className="flex-1">
                <div>{item.name}</div>
                {item.disabled && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// Mobile Sidebar Content Component
export function MobileSidebarContent({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoadingItems(new Set());
  }, [pathname]);

  const handleNavigation = async (href: string, itemName: string) => {
    if (loadingItems.has(itemName) || pathname === href) return;

    setLoadingItems(prev => new Set(prev).add(itemName));
    try {
      router.push(href);
      if (onNavigate) {
        onNavigate();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemName);
        return newSet;
      });
    }
  };

  return (
    <nav className="p-4 space-y-2">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const isLoading = loadingItems.has(item.name);
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            onClick={() => {
              if (!item.disabled) {
                handleNavigation(item.href, item.name);
              }
            }}
            disabled={item.disabled || isLoading}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left',
              isActive
                ? 'bg-primary text-primary-foreground cursor-pointer'
                : item.disabled
                  ? 'text-muted-foreground cursor-not-allowed opacity-50'
                  : isLoading
                    ? 'text-foreground opacity-75 cursor-wait'
                    : 'text-foreground hover:bg-accent cursor-pointer'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <div className="flex-1">
              <div>{item.name}</div>
              {item.disabled && (
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}

