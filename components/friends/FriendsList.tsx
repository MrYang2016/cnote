'use client'

/**
 * 好友列表组件
 * Phase 3
 */

import { useState, useEffect } from 'react'
import { UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface Friend {
  friend_id: string
  username: string
  display_name: string
  created_at: string
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends?type=friends')
      const data = await res.json()

      if (res.ok) {
        setFriends(data.friends || [])
      } else {
        toast.error(data.error || 'Failed to load friends')
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    setRemovingId(friendId)
    try {
      const res = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Friend removed')
        setFriends((prev) => prev.filter((f) => f.friend_id !== friendId))
      } else {
        toast.error(data.error || 'Failed to remove friend')
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('An error occurred')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No friends yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add friends to share notes with them
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {friends.map((friend, index) => (
        <Card key={`${friend.friend_id}-${index}`} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{friend.display_name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                @{friend.username}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Friends since {new Date(friend.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFriend(friend.friend_id)}
              disabled={removingId === friend.friend_id}
            >
              {removingId === friend.friend_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

