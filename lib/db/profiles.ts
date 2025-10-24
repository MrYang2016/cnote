/**
 * Profile database operations
 */

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/utils/types';

/**
 * Get profile by user ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Create a new profile
 */
export async function createProfile(
  userId: string,
  username: string,
  displayName?: string
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      display_name: displayName || username,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return data;
}

/**
 * Update profile
 */
export async function updateProfile(
  userId: string,
  updates: { username?: string; display_name?: string }
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  // If no data found, username is available
  return !data && error?.code === 'PGRST116';
}

