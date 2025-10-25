'use client'

/**
 * 好友请求组件
 * Phase 3
 */

import { useState, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
  from_user?: {
    username: string
    display_name: string
  }
  to_user?: {
    username: string
    display_name: string
  }
}

export function FriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch('/api/friends?type=received'),
        fetch('/api/friends?type=sent'),
      ])

      const [receivedData, sentData] = await Promise.all([
        receivedRes.json(),
        sentRes.json(),
      ])

      if (receivedRes.ok) {
        setReceivedRequests(receivedData.requests || [])
      }
      if (sentRes.ok) {
        setSentRequests(sentData.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load friend requests')
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'accept' | 'reject' | 'cancel') => {
    setProcessingId(requestId)
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        // 移除已处理的请求
        if (action === 'accept' || action === 'reject') {
          setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId))
        } else {
          setSentRequests((prev) => prev.filter((r) => r.id !== requestId))
        }

        // 如果接受了请求，可能需要刷新好友列表
        if (action === 'accept') {
          // 触发父组件刷新（通过 custom event）
          window.dispatchEvent(new CustomEvent('friendsUpdated'))
        }
      } else {
        toast.error(data.error || 'Failed to process request')
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 收到的请求 */}
      <div>
        <h3 className="font-medium mb-3">Received Requests</h3>
        {receivedRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No pending requests
          </p>
        ) : (
          <div className="space-y-3">
            {receivedRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {request.from_user?.display_name || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      @{request.from_user?.username || 'unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRequest(request.id, 'accept')}
                      disabled={processingId === request.id}
                      className="cursor-pointer"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRequest(request.id, 'reject')}
                      disabled={processingId === request.id}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 发送的请求 */}
      <div>
        <h3 className="font-medium mb-3">Sent Requests</h3>
        {sentRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No pending requests
          </p>
        ) : (
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {request.to_user?.display_name || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      @{request.to_user?.username || 'unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRequest(request.id, 'cancel')}
                    disabled={processingId === request.id}
                    className="cursor-pointer"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

