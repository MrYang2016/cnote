'use client'

/**
 * 添加好友对话框
 * Phase 3
 */

import { useState } from 'react'
import { UserPlus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface SearchUser {
  id: string
  username: string
  display_name: string
}

export function AddFriendDialog() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a username')
      return
    }

    setSearching(true)
    try {
      const res = await fetch(
        `/api/friends?type=search&query=${encodeURIComponent(searchQuery)}`
      )
      const data = await res.json()

      if (res.ok) {
        setSearchResults(data.users || [])
        if (data.users.length === 0) {
          toast.info('No users found')
        }
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('An error occurred')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (username: string) => {
    setSendingTo(username)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Friend request sent!')
        setSearchResults([])
        setSearchQuery('')
      } else {
        toast.error(data.error || 'Failed to send request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('An error occurred')
    } finally {
      setSendingTo(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for users by email address and send them a friend request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              variant="secondary"
              className="cursor-pointer"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {user.display_name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.username)}
                      disabled={sendingTo === user.username}
                      className="cursor-pointer"
                    >
                      {sendingTo === user.username ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

