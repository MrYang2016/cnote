/**
 * 笔记共享 API
 * Phase 3
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  shareNoteWithFriend,
  shareNoteWithMultipleFriends,
  unshareNote,
  unshareNoteWithUser,
  getNoteShares,
  getSharedNotes,
  checkNoteAccess,
  updateSharePermission,
} from '@/lib/db/shares'
import { createClient } from '@/lib/supabase/server'

// =====================================================
// GET: 获取笔记共享信息
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
    const type = searchParams.get('type') // 'note' | 'shared-with-me' | 'access'
    const noteId = searchParams.get('noteId')

    switch (type) {
      case 'note':
        // 获取特定笔记的共享列表
        if (!noteId) {
          return NextResponse.json(
            { error: 'Note ID required' },
            { status: 400 }
          )
        }
        const shares = await getNoteShares(noteId)
        return NextResponse.json({ shares })

      case 'shared-with-me':
        // 获取共享给我的所有笔记
        const sharedNotes = await getSharedNotes()
        return NextResponse.json({ sharedNotes })

      case 'access':
        // 检查对特定笔记的访问权限
        if (!noteId) {
          return NextResponse.json(
            { error: 'Note ID required' },
            { status: 400 }
          )
        }
        const access = await checkNoteAccess(noteId)
        return NextResponse.json(access)

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in GET /api/shares:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: 共享笔记
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
    const { noteId, friendIds, permission = 'read' } = body

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 })
    }

    if (!friendIds || friendIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one friend required' },
        { status: 400 }
      )
    }

    // 验证 permission 值
    if (permission !== 'read' && permission !== 'write') {
      return NextResponse.json(
        { error: 'Invalid permission value' },
        { status: 400 }
      )
    }

    // 如果只有一个好友，直接共享
    if (friendIds.length === 1) {
      const result = await shareNoteWithFriend(noteId, friendIds[0], permission)
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
      return NextResponse.json({
        message: result.message,
        share: result.share,
      })
    }

    // 批量共享给多个好友
    const result = await shareNoteWithMultipleFriends(
      noteId,
      friendIds,
      permission
    )
    return NextResponse.json({
      message: result.message,
      successCount: result.successCount,
      totalCount: friendIds.length,
    })
  } catch (error) {
    console.error('Error in POST /api/shares:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// PATCH: 更新共享权限
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
    const { shareId, permission } = body

    if (!shareId || !permission) {
      return NextResponse.json(
        { error: 'Share ID and permission required' },
        { status: 400 }
      )
    }

    if (permission !== 'read' && permission !== 'write') {
      return NextResponse.json(
        { error: 'Invalid permission value' },
        { status: 400 }
      )
    }

    const result = await updateSharePermission(shareId, permission)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Error in PATCH /api/shares:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: 取消共享
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
    const shareId = searchParams.get('shareId')
    const noteId = searchParams.get('noteId')
    const userId = searchParams.get('userId')

    // 通过 shareId 删除
    if (shareId) {
      const result = await unshareNote(shareId)
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
      return NextResponse.json({ message: result.message })
    }

    // 通过 noteId + userId 删除
    if (noteId && userId) {
      const result = await unshareNoteWithUser(noteId, userId)
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
      return NextResponse.json({ message: result.message })
    }

    return NextResponse.json(
      { error: 'shareId or (noteId and userId) required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/shares:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

