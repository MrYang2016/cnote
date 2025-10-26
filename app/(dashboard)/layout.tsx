/**
 * Dashboard Layout
 * Protected layout with header and sidebar
 */

import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/db/profiles';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/layout/DashboardContent';

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
    <DashboardContent username={profile?.username || profile?.display_name || undefined}>
      {children}
    </DashboardContent>
  );
}

