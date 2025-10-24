/**
 * Shared MCP Server
 * 提供访问共享笔记的 MCP 接口
 * Phase 3
 */

import { createClient } from '@/lib/supabase/server'
import { MCPResource, MCPTool, MCPServerInfo, SharedNote } from './types'

/**
 * 获取服务器信息
 */
export async function getServerInfo(): Promise<MCPServerInfo> {
  return {
    name: 'cnote-shared',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    capabilities: {
      resources: true,
      tools: true,
      prompts: true,
    },
  }
}

/**
 * 列出所有共享笔记资源
 */
export async function listResources(userId: string): Promise<MCPResource[]> {
  const supabase = await createClient()

  const { data: sharedNotes, error } = await supabase.rpc('get_shared_notes', {
    p_user_id: userId,
  })

  if (error || !sharedNotes) {
    console.error('Error fetching shared notes:', error)
    return []
  }

  return sharedNotes.map((note: SharedNote) => ({
    uri: `shared://${note.note_id}`,
    name: note.title,
    description: `Shared by ${note.owner_username} (${note.permission})`,
    mimeType: 'text/markdown',
  }))
}

/**
 * 读取特定共享笔记资源
 */
export async function readResource(
  uri: string,
  userId: string
): Promise<{ contents: string; mimeType: string } | null> {
  // 从 URI 中提取笔记 ID (格式: shared://note-id)
  const noteId = uri.replace('shared://', '')

  const supabase = await createClient()

  // 验证访问权限并获取笔记
  const { data: share } = await supabase
    .from('note_shares')
    .select('note_id, permission')
    .eq('note_id', noteId)
    .eq('shared_with_user_id', userId)
    .single()

  if (!share) {
    console.error('No access to this shared note')
    return null
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('*, profiles!notes_user_id_fkey(username, display_name)')
    .eq('id', noteId)
    .single()

  if (error || !note) {
    console.error('Error fetching shared note:', error)
    return null
  }

  // 格式化笔记内容为 Markdown
  const ownerInfo = note.profiles as unknown as { username: string; display_name: string }
  const markdown = `# ${note.title}

${note.content}

---
*Shared by: ${ownerInfo?.display_name || 'Unknown'} (@${ownerInfo?.username || 'unknown'})*
*Permission: ${share.permission}*
*Created: ${new Date(note.created_at).toLocaleString()}*
*Updated: ${new Date(note.updated_at).toLocaleString()}*
`

  return {
    contents: markdown,
    mimeType: 'text/markdown',
  }
}

/**
 * 列出所有可用工具
 */
export function listTools(): MCPTool[] {
  return [
    {
      name: 'search_shared_notes',
      description: 'Search notes shared with you by keyword',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (keywords)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 5)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_shared_note',
      description: 'Get full content of a specific shared note by ID',
      inputSchema: {
        type: 'object',
        properties: {
          noteId: {
            type: 'string',
            description: 'The ID of the shared note to retrieve',
          },
        },
        required: ['noteId'],
      },
    },
    {
      name: 'list_shared_notes',
      description: 'List all notes shared with you',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of notes to return (default: 20)',
          },
        },
      },
    },
    {
      name: 'list_by_friend',
      description: 'List notes shared by a specific friend',
      inputSchema: {
        type: 'object',
        properties: {
          friendUsername: {
            type: 'string',
            description: 'Username of the friend',
          },
        },
        required: ['friendUsername'],
      },
    },
  ]
}

/**
 * 执行工具调用
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  const supabase = await createClient()

  switch (name) {
    case 'search_shared_notes': {
      const query = args.query as string
      const limit = (args.limit as number) || 5

      // 获取共享笔记并搜索
      const { data: sharedNotes } = await supabase.rpc('get_shared_notes', {
        p_user_id: userId,
      })

      if (!sharedNotes) {
        return { results: [] }
      }

      // 简单文本匹配
      const filtered = sharedNotes
        .filter(
          (note: SharedNote) =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)

      return {
        results: filtered.map((note: SharedNote) => ({
          id: note.note_id,
          title: note.title,
          excerpt: note.content.substring(0, 200) + '...',
          owner: note.owner_username,
          permission: note.permission,
          updated_at: note.updated_at,
        })),
      }
    }

    case 'get_shared_note': {
      const noteId = args.noteId as string

      // 验证访问权限
      const { data: share } = await supabase
        .from('note_shares')
        .select('*')
        .eq('note_id', noteId)
        .eq('shared_with_user_id', userId)
        .single()

      if (!share) {
        throw new Error('You do not have access to this note')
      }

      const { data: note, error } = await supabase
        .from('notes')
        .select('*, profiles!notes_user_id_fkey(username, display_name)')
        .eq('id', noteId)
        .single()

      if (error) {
        throw new Error(`Failed to get shared note: ${error.message}`)
      }

      return {
        ...note,
        permission: share.permission,
      }
    }

    case 'list_shared_notes': {
      const limit = (args.limit as number) || 20

      const { data: sharedNotes, error } = await supabase.rpc(
        'get_shared_notes',
        {
          p_user_id: userId,
        }
      )

      if (error) {
        throw new Error(`Failed to list shared notes: ${error.message}`)
      }

      return {
        notes: sharedNotes?.slice(0, limit).map((note: SharedNote) => ({
          id: note.note_id,
          title: note.title,
          excerpt: note.content.substring(0, 200) + '...',
          owner: note.owner_username,
          permission: note.permission,
          updated_at: note.updated_at,
        })),
      }
    }

    case 'list_by_friend': {
      const friendUsername = args.friendUsername as string

      const { data: sharedNotes } = await supabase.rpc('get_shared_notes', {
        p_user_id: userId,
      })

      if (!sharedNotes) {
        return { notes: [] }
      }

      const filtered = sharedNotes.filter(
        (note: SharedNote) => note.owner_username === friendUsername
      )

      return {
        notes: filtered.map((note: SharedNote) => ({
          id: note.note_id,
          title: note.title,
          excerpt: note.content.substring(0, 200) + '...',
          permission: note.permission,
          updated_at: note.updated_at,
        })),
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

/**
 * 列出所有提示词模板
 */
export function listPrompts() {
  return [
    {
      name: 'summarize_shared',
      description: 'Generate a summary of notes shared with you',
      arguments: [
        {
          name: 'friendUsername',
          description: 'Optional: focus on notes from a specific friend',
          required: false,
        },
      ],
    },
    {
      name: 'compare_perspectives',
      description: 'Compare your notes with shared notes on a topic',
      arguments: [
        {
          name: 'topic',
          description: 'The topic to compare',
          required: true,
        },
      ],
    },
  ]
}

/**
 * 获取提示词内容
 */
export async function getPrompt(
  name: string,
  args: Record<string, string>,
  userId: string
): Promise<{ messages: Array<{ role: string; content: string }> }> {
  const supabase = await createClient()

  switch (name) {
    case 'summarize_shared': {
      const friendUsername = args.friendUsername

      const { data: sharedNotes } = await supabase.rpc('get_shared_notes', {
        p_user_id: userId,
      })

      let notes = sharedNotes || []
      if (friendUsername) {
        notes = notes.filter(
          (n: SharedNote) => n.owner_username === friendUsername
        )
      }

      const notesText = notes
        .map(
          (n: SharedNote) =>
            `## ${n.title} (by @${n.owner_username})\n${n.content}`
        )
        .join('\n\n')

      const focus = friendUsername
        ? `notes shared by @${friendUsername}`
        : 'all shared notes'

      return {
        messages: [
          {
            role: 'user',
            content: `Please summarize the following ${focus}:\n\n${notesText}`,
          },
        ],
      }
    }

    case 'compare_perspectives': {
      const topic = args.topic

      return {
        messages: [
          {
            role: 'user',
            content: `Compare my notes with notes shared by friends on the topic: ${topic}. Highlight different perspectives and insights.`,
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

