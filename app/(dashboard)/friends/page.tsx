/**
 * 好友管理页面
 * Phase 3
 */

import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FriendsList } from '@/components/friends/FriendsList'
import { FriendRequests } from '@/components/friends/FriendRequests'
import { AddFriendDialog } from '@/components/friends/AddFriendDialog'

export const metadata: Metadata = {
  title: 'Friends | AI Note System',
  description: 'Manage your friends and share notes',
}

export default function FriendsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground mt-1">
            Manage your friends and share notes with them
          </p>
        </div>
        <AddFriendDialog />
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests">
          <FriendRequests />
        </TabsContent>
      </Tabs>
    </div>
  )
}

