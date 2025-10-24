/**
 * MCP (Model Context Protocol) 类型定义
 * Phase 3
 */

export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface MCPPrompt {
  name: string
  description: string
  arguments?: Array<{
    name: string
    description: string
    required: boolean
  }>
}

export interface MCPServerInfo {
  name: string
  version: string
  protocolVersion: string
  capabilities: {
    resources?: boolean
    tools?: boolean
    prompts?: boolean
  }
}

export interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  is_shared: boolean
  user_id: string
}

export interface SharedNote {
  note_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  is_shared: boolean
  owner_id: string
  owner_username: string
  owner_display_name: string
  permission: 'read' | 'write'
}

