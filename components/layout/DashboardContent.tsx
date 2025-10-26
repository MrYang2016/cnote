/**
 * Dashboard Content Component
 * Client component for mobile menu handling
 */

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar, MobileSidebarContent } from '@/components/layout/Sidebar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet';

interface DashboardContentProps {
  children: React.ReactNode;
  username?: string;
}

export function DashboardContent({ children, username }: DashboardContentProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        username={username}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <div className="flex">
        <Sidebar username={username} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          </SheetHeader>
          <MobileSidebarContent username={username} onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

