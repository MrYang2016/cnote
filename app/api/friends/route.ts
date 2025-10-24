/**
 * 好友管理 API
 * Phase 3
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
} from '@/lib/db/friends'
import { createClient } from '@/lib/supabase/server'

// =====================================================
// GET: 获取好友列表和请求
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'friends' | 'received' | 'sent' | 'search'
    const query = searchParams.get('query')

    switch (type) {
      case 'friends':
        const friends = await getFriends()
        return NextResponse.json({ friends })

      case 'received':
        const receivedRequests = await getReceivedFriendRequests()
        return NextResponse.json({ requests: receivedRequests })

      case 'sent':
        const sentRequests = await getSentFriendRequests()
        return NextResponse.json({ requests: sentRequests })

      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 })
        }
        const users = await searchUsers(query)
        return NextResponse.json({ users })

      default:
        // 默认返回所有信息
        const [allFriends, received, sent] = await Promise.all([
          getFriends(),
          getReceivedFriendRequests(),
          getSentFriendRequests(),
        ])
        return NextResponse.json({
          friends: allFriends,
          receivedRequests: received,
          sentRequests: sent,
        })
    }
  } catch (error) {
    console.error('Error in GET /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: 发送好友请求
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const result = await sendFriendRequest(username)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      request: result.request,
    })
  } catch (error) {
    console.error('Error in POST /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// PATCH: 接受/拒绝好友请求
// =====================================================

export async function PATCH(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, action } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    let result
    if (action === 'accept') {
      result = await acceptFriendRequest(requestId)
    } else if (action === 'reject') {
      result = await rejectFriendRequest(requestId)
    } else if (action === 'cancel') {
      result = await cancelFriendRequest(requestId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Error in PATCH /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: 删除好友
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      )
    }

    const result = await removeFriend(friendId)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Error in DELETE /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

