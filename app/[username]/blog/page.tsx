/**
 * Blog Page
 * Public blog page for a user
 */

import { notFound } from 'next/navigation';
import { getBlogPosts, getUserByUsername } from '@/lib/db/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, User } from 'lucide-react';

export default async function BlogPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Get user by username
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  // Get blog posts
  const posts = await getBlogPosts(username);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{user.display_name || user.username}'s Blog</h1>
          <p className="text-muted-foreground">@{username}</p>
        </div>

        {/* Blog Posts */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No blog posts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">
                        <Link
                          href={`/${username}/blog/${post.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author.display_name || post.author.username}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 ? '...' : ''}
                  </p>
                  <Link
                    href={`/${username}/blog/${post.id}`}
                    className="text-primary hover:underline inline-block mt-4"
                  >
                    Read more →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

