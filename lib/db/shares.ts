/**
 * 笔记共享数据库操作
 * Phase 3: 笔记共享功能
 */

import { createClient } from '@/lib/supabase/server'

// =====================================================
// 类型定义
// =====================================================

export interface NoteShare {
  id: string
  note_id: string
  owner_id: string
  shared_with_user_id: string
  permission: 'read' | 'write'
  created_at: string
  shared_with_user?: {
    username: string
    display_name: string
  }
}

export interface SharedNote {
  note_id: string
  title: string
  content: string
  is_shared: boolean
  permission: 'read' | 'write'
  owner_id: string
  owner_username: string
  owner_display_name: string
  created_at: string
  updated_at: string
}

// =====================================================
// 笔记共享操作
// =====================================================

/**
 * 共享笔记给好友
 */
export async function shareNoteWithFriend(
  noteId: string,
  friendId: string,
  permission: 'read' | 'write' = 'read'
): Promise<{ success: boolean; message: string; share?: NoteShare }> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // 验证笔记是否属于当前用户
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      return { success: false, message: 'Note not found' }
    }

    if (note.user_id !== user.id) {
      return { success: false, message: 'You can only share your own notes' }
    }

    // 验证是否是好友
    const { data: isFriend } = await supabase.rpc('are_friends', {
      user1_id: user.id,
      user2_id: friendId,
    })

    if (!isFriend) {
      return { success: false, message: 'Can only share with friends' }
    }

    // 检查是否已经共享
    const { data: existingShare } = await supabase
      .from('note_shares')
      .select('id, permission')
      .eq('note_id', noteId)
      .eq('shared_with_user_id', friendId)
      .single()

    if (existingShare) {
      // 如果已经共享，更新权限
      const { data: updatedShare, error: updateError } = await supabase
        .from('note_shares')
        .update({ permission })
        .eq('id', existingShare.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating share:', updateError)
        return { success: false, message: 'Failed to update share permission' }
      }

      return {
        success: true,
        message: 'Share permission updated',
        share: updatedShare,
      }
    }

    // 创建新的共享
    const { data: share, error: shareError } = await supabase
      .from('note_shares')
      .insert({
        note_id: noteId,
        owner_id: user.id,
        shared_with_user_id: friendId,
        permission,
      })
      .select()
      .single()

    if (shareError) {
      console.error('Error sharing note:', shareError)
      return { success: false, message: 'Failed to share note' }
    }

    return { success: true, message: 'Note shared successfully', share }
  } catch (error) {
    console.error('Error in shareNoteWithFriend:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 批量共享笔记给多个好友
 */
export async function shareNoteWithMultipleFriends(
  noteId: string,
  friendIds: string[],
  permission: 'read' | 'write' = 'read'
): Promise<{ success: boolean; message: string; successCount: number }> {
  let successCount = 0

  for (const friendId of friendIds) {
    const result = await shareNoteWithFriend(noteId, friendId, permission)
    if (result.success) {
      successCount++
    }
  }

  const allSuccess = successCount === friendIds.length
  return {
    success: allSuccess,
    message: allSuccess
      ? 'Note shared with all friends'
      : `Note shared with ${successCount} out of ${friendIds.length} friends`,
    successCount,
  }
}

/**
 * 取消笔记共享
 */
export async function unshareNote(
  shareId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from('note_shares').delete().eq('id', shareId)

    if (error) {
      console.error('Error unsharing note:', error)
      return { success: false, message: 'Failed to unshare note' }
    }

    return { success: true, message: 'Note unshared successfully' }
  } catch (error) {
    console.error('Error in unshareNote:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 取消笔记与特定用户的共享
 */
export async function unshareNoteWithUser(
  noteId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('note_shares')
      .delete()
      .eq('note_id', noteId)
      .eq('owner_id', user.id)
      .eq('shared_with_user_id', userId)

    if (error) {
      console.error('Error unsharing note with user:', error)
      return { success: false, message: 'Failed to unshare note' }
    }

    return { success: true, message: 'Note unshared successfully' }
  } catch (error) {
    console.error('Error in unshareNoteWithUser:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * 获取笔记的共享列表
 */
export async function getNoteShares(noteId: string): Promise<NoteShare[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('note_shares')
      .select(
        `
        *,
        shared_with_user:profiles!note_shares_shared_with_user_id_fkey(username, display_name)
      `
      )
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching note shares:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getNoteShares:', error)
    return []
  }
}

/**
 * 获取共享给我的所有笔记
 */
export async function getSharedNotes(): Promise<SharedNote[]> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase.rpc('get_shared_notes', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Error fetching shared notes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSharedNotes:', error)
    return []
  }
}

/**
 * 检查用户是否有访问笔记的权限
 */
export async function checkNoteAccess(
  noteId: string
): Promise<{
  hasAccess: boolean
  permission?: 'read' | 'write'
  isOwner: boolean
}> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { hasAccess: false, isOwner: false }
    }

    // 检查是否是笔记所有者
    const { data: note } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()

    if (note && note.user_id === user.id) {
      return { hasAccess: true, permission: 'write', isOwner: true }
    }

    // 检查是否有共享权限
    const { data: share } = await supabase
      .from('note_shares')
      .select('permission')
      .eq('note_id', noteId)
      .eq('shared_with_user_id', user.id)
      .single()

    if (share) {
      return {
        hasAccess: true,
        permission: share.permission,
        isOwner: false,
      }
    }

    return { hasAccess: false, isOwner: false }
  } catch (error) {
    console.error('Error checking note access:', error)
    return { hasAccess: false, isOwner: false }
  }
}

/**
 * 更新共享权限
 */
export async function updateSharePermission(
  shareId: string,
  permission: 'read' | 'write'
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('note_shares')
      .update({ permission })
      .eq('id', shareId)

    if (error) {
      console.error('Error updating share permission:', error)
      return { success: false, message: 'Failed to update permission' }
    }

    return { success: true, message: 'Permission updated successfully' }
  } catch (error) {
    console.error('Error in updateSharePermission:', error)
    return { success: false, message: 'An error occurred' }
  }
}

