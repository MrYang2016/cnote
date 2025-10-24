/**
 * Login/Register Form Component
 * Single form that handles both login and registration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Generate a simple email from username for Supabase Auth
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@ainote.app`;

      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: username,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          // Create profile for new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              username,
              display_name: username,
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

          toast.success(`Welcome, ${username}! Your account has been created.`);
        }
      } else if (signInData.user) {
        toast.success(`Welcome back, ${username}!`);
      }

      // Redirect to notes page
      router.push('/notes');
      router.refresh();
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">AI Note System</CardTitle>
        <CardDescription>
          Enter your credentials to login or create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

