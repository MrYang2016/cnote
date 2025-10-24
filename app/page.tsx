/**
 * Landing Page
 * Redirects to login or notes based on auth status
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to notes
  if (user) {
    redirect('/notes');
  }

  // Otherwise redirect to login
  redirect('/login');
}
