/**
 * 好友系统数据库操作
 * Phase 3: 好友管理功能
 */

import { createClient } from '@/lib/supabase/server'

// =====================================================
// 类型定义
// =====================================================

export interface Friend {
  friend_id: string
  username: string
  display_name: string
  created_at: string
}

export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  from_user?: {
    username: string
    display_name: string
  }
  to_user?: {
    username: string
    display_name: string
  }
}

export interface FriendRequestResponse {
  success: boolean
  message: string
  friend_id?: string
}

// =====================================================
// 好友请求相关操作
// =====================================================

/**
 * 发送好友请求
 */
export async function sendFriendRequest(
  toUsername: string
): Promise<{ success: boolean; message: string; request?: FriendRequest }> {
  const supabase = await createClient()

  try {
    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // 根据用户名查找目标用户
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', toUsername)
      .single()

    if (userError || !targetUser) {
      return { success: false, message: 'User not found' }
    }

    // 检查是否试图添加自己
    if (targetUser.id === user.id) {
      return { success: false, message: 'Cannot add yourself as a friend' }
    }

    // 检查是否已经是好友
    const { data: existingFriend } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${user.id})`)
      .single()

    if (existingFriend) {
      return { success: false, message: 'Already friends' }
    }

    // 检查是否已经发送过请求
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(
        `and(from_user_id.eq.${user.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${user.id})`
      )
      .single()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { success: false, message: 'Friend request already pending' }
      }
      // 如果之前被拒绝，可以重新发送
    }

    // 创建好友请求
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: targetUser.id,
        status: 'pending',
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating friend request:', requestError)
      return { success: false, message: 'Failed to send friend request' }
    }

    return {
      success: true,
      message: 'Friend request sent',
      request,
    }
  } catch (error) {
    console.error('Error in sendFriendRequest:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 接受好友请求
 */
export async function acceptFriendRequest(
  requestId: string
): Promise<FriendRequestResponse> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('accept_friend_request', {
      request_id: requestId,
    })

    if (error) {
      console.error('Error accepting friend request:', error)
      return { success: false, message: error.message }
    }

    return data as FriendRequestResponse
  } catch (error) {
    console.error('Error in acceptFriendRequest:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 拒绝好友请求
 */
export async function rejectFriendRequest(
  requestId: string
): Promise<FriendRequestResponse> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('reject_friend_request', {
      request_id: requestId,
    })

    if (error) {
      console.error('Error rejecting friend request:', error)
      return { success: false, message: error.message }
    }

    return data as FriendRequestResponse
  } catch (error) {
    console.error('Error in rejectFriendRequest:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 取消发送的好友请求
 */
export async function cancelFriendRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Error canceling friend request:', error)
      return { success: false, message: 'Failed to cancel request' }
    }

    return { success: true, message: 'Friend request canceled' }
  } catch (error) {
    console.error('Error in cancelFriendRequest:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 获取收到的好友请求
 */
export async function getReceivedFriendRequests(): Promise<FriendRequest[]> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('friend_requests')
      .select(
        `
        *,
        from_user:profiles!friend_requests_from_user_id_fkey(username, display_name)
      `
      )
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching received requests:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getReceivedFriendRequests:', error)
    return []
  }
}

/**
 * 获取发送的好友请求
 */
export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('friend_requests')
      .select(
        `
        *,
        to_user:profiles!friend_requests_to_user_id_fkey(username, display_name)
      `
      )
      .eq('from_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sent requests:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSentFriendRequests:', error)
    return []
  }
}

// =====================================================
// 好友列表操作
// =====================================================

/**
 * 获取好友列表
 */
export async function getFriends(): Promise<Friend[]> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase.rpc('get_friends_with_profiles', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Error fetching friends:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFriends:', error)
    return []
  }
}

/**
 * 删除好友
 */
export async function removeFriend(
  friendId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // 删除好友关系（双向）
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (error) {
      console.error('Error removing friend:', error)
      return { success: false, message: 'Failed to remove friend' }
    }

    return { success: true, message: 'Friend removed' }
  } catch (error) {
    console.error('Error in removeFriend:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 检查是否是好友
 */
export async function checkFriendship(
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase.rpc('are_friends', {
      user1_id: user.id,
      user2_id: userId,
    })

    return data === true
  } catch (error) {
    console.error('Error checking friendship:', error)
    return false
  }
}

/**
 * 搜索用户（用于添加好友）
 * 通过email搜索用户
 */
export async function searchUsers(
  query: string
): Promise<Array<{ id: string; username: string; display_name: string }>> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    // 清理搜索查询
    const cleanQuery = query.trim().toLowerCase()

    // 如果查询不包含@符号，添加@ainote.app后缀
    let emailQuery = cleanQuery
    if (!cleanQuery.includes('@')) {
      emailQuery = `${cleanQuery}@ainote.app`
    }

    // 由于无法直接访问auth.users表，我们通过已知的email模式来搜索
    // 提取用户名部分，并尝试多种格式匹配
    const usernameFromEmail = emailQuery.split('@')[0]

    // 搜索profiles表，使用ilike进行不区分大小写的匹配
    // 同时搜索username和display_name字段
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.%${usernameFromEmail}%,display_name.ilike.%${usernameFromEmail}%`)
      .neq('id', user.id) // 排除自己

    if (error) {
      console.error('Error searching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchUsers:', error)
    return []
  }
}

