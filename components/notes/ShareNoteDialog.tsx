'use client'

/**
 * 分享笔记对话框
 * Phase 3
 */

import { useState, useEffect } from 'react'
import { Share2, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Friend {
  friend_id: string
  username: string
  display_name: string
}

interface ShareNoteDialogProps {
  noteId: string
  currentShares?: Array<{ shared_with_user_id: string; permission: string }>
}

export function ShareNoteDialog({ noteId, currentShares = [] }: ShareNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [permission, setPermission] = useState<'read' | 'write'>('read')

  useEffect(() => {
    if (open) {
      fetchFriends()
    }
  }, [open])

  const fetchFriends = async () => {
    setLoading(true)
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

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(friendId)) {
        newSet.delete(friendId)
      } else {
        newSet.add(friendId)
      }
      return newSet
    })
  }

  const handleShare = async () => {
    if (selectedFriends.size === 0) {
      toast.error('Please select at least one friend')
      return
    }

    setSharing(true)
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          friendIds: Array.from(selectedFriends),
          permission,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Note shared successfully')
        setSelectedFriends(new Set())
        setOpen(false)
      } else {
        toast.error(data.error || 'Failed to share note')
      }
    } catch (error) {
      console.error('Error sharing note:', error)
      toast.error('An error occurred')
    } finally {
      setSharing(false)
    }
  }

  const isAlreadyShared = (friendId: string) => {
    return currentShares.some((share) => share.shared_with_user_id === friendId)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note with Friends</DialogTitle>
          <DialogDescription>
            Select friends to share this note with
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 权限选择 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Permission Level
            </label>
            <Select
              value={permission}
              onValueChange={(value) => setPermission(value as 'read' | 'write')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="write">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 好友列表 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Friends
            </label>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No friends yet. Add friends first!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {friends.map((friend) => {
                  const alreadyShared = isAlreadyShared(friend.friend_id)
                  const isSelected = selectedFriends.has(friend.friend_id)

                  return (
                    <Card
                      key={friend.friend_id}
                      className={`p-3 cursor-pointer transition-colors ${isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                        } ${alreadyShared ? 'opacity-50' : ''}`}
                      onClick={() => !alreadyShared && toggleFriend(friend.friend_id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {friend.display_name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                        {alreadyShared ? (
                          <span className="text-xs text-muted-foreground">
                            Already shared
                          </span>
                        ) : isSelected ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : null}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing || selectedFriends.size === 0}
              className="cursor-pointer"
            >
              {sharing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share ({selectedFriends.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

