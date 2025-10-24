/**
 * Dashboard Layout
 * Protected layout with header and sidebar
 */

import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/db/profiles';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const profile = await getProfile(user.id);

  return (
    <div className="min-h-screen bg-background">
      <Header username={profile?.username || profile?.display_name || undefined} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

