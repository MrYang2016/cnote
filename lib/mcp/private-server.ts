/**
 * Private MCP Server
 * 提供访问个人笔记的 MCP 接口
 * Phase 3
 */

import { createClient } from '@/lib/supabase/server'
import { MCPResource, MCPTool, MCPServerInfo, Note } from './types'

/**
 * 获取服务器信息
 */
export async function getServerInfo(): Promise<MCPServerInfo> {
  return {
    name: 'cnote-private',
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
 * 列出所有个人笔记资源
 */
export async function listResources(userId: string): Promise<MCPResource[]> {
  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !notes) {
    console.error('Error fetching notes:', error)
    return []
  }

  return notes.map((note) => ({
    uri: `note://${note.id}`,
    name: note.title,
    description: `Personal note created ${new Date(note.created_at).toLocaleDateString()}`,
    mimeType: 'text/markdown',
  }))
}

/**
 * 读取特定笔记资源
 */
export async function readResource(
  uri: string,
  userId: string
): Promise<{ contents: string; mimeType: string } | null> {
  // 从 URI 中提取笔记 ID (格式: note://note-id)
  const noteId = uri.replace('note://', '')

  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (error || !note) {
    console.error('Error fetching note:', error)
    return null
  }

  // 格式化笔记内容为 Markdown
  const markdown = `# ${note.title}

${note.content}

---
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
      name: 'search_notes',
      description: 'Search personal notes by keyword or semantic meaning',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (keywords or natural language)',
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
      name: 'get_note',
      description: 'Get full content of a specific note by ID',
      inputSchema: {
        type: 'object',
        properties: {
          noteId: {
            type: 'string',
            description: 'The ID of the note to retrieve',
          },
        },
        required: ['noteId'],
      },
    },
    {
      name: 'list_recent_notes',
      description: 'List most recently updated notes',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of notes to return (default: 10)',
          },
        },
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
    case 'search_notes': {
      const query = args.query as string
      const limit = (args.limit as number) || 5

      // 简单关键词搜索
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at, updated_at')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit)

      if (error) {
        throw new Error(`Search failed: ${error.message}`)
      }

      return {
        results: notes?.map((note) => ({
          id: note.id,
          title: note.title,
          excerpt: note.content.substring(0, 200) + '...',
          updated_at: note.updated_at,
        })),
      }
    }

    case 'get_note': {
      const noteId = args.noteId as string

      const { data: note, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single()

      if (error) {
        throw new Error(`Failed to get note: ${error.message}`)
      }

      return note
    }

    case 'list_recent_notes': {
      const limit = (args.limit as number) || 10

      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to list notes: ${error.message}`)
      }

      return {
        notes: notes?.map((note) => ({
          id: note.id,
          title: note.title,
          excerpt: note.content.substring(0, 200) + '...',
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
      name: 'summarize_notes',
      description: 'Generate a summary of all notes',
      arguments: [
        {
          name: 'focus',
          description: 'Optional focus area for the summary',
          required: false,
        },
      ],
    },
    {
      name: 'find_related',
      description: 'Find notes related to a specific topic',
      arguments: [
        {
          name: 'topic',
          description: 'The topic to find related notes for',
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
    case 'summarize_notes': {
      const focus = args.focus || 'all topics'

      // 获取最近的笔记
      const { data: notes } = await supabase
        .from('notes')
        .select('title, content')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      const notesText = notes
        ?.map((n) => `## ${n.title}\n${n.content}`)
        .join('\n\n')

      return {
        messages: [
          {
            role: 'user',
            content: `Please summarize the following notes, focusing on ${focus}:\n\n${notesText}`,
          },
        ],
      }
    }

    case 'find_related': {
      const topic = args.topic

      return {
        messages: [
          {
            role: 'user',
            content: `Search my notes for anything related to: ${topic}`,
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

