/**
 * Shared  Server API
 * Phase 3
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getServerInfo,
  listResources,
  readResource,
  listTools,
  callTool,
  listPrompts,
  getPrompt,
} from '@/lib/mcp/shared-server'

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
    const { method, params } = body

    switch (method) {
      case 'initialize':
        const serverInfo = await getServerInfo()
        return NextResponse.json({ result: serverInfo })

      case 'resources/list':
        const resources = await listResources(user.id)
        return NextResponse.json({ result: { resources } })

      case 'resources/read':
        const { uri } = params
        const resource = await readResource(uri, user.id)
        if (!resource) {
          return NextResponse.json(
            { error: 'Resource not found or access denied' },
            { status: 404 }
          )
        }
        return NextResponse.json({ result: resource })

      case 'tools/list':
        const tools = listTools()
        return NextResponse.json({ result: { tools } })

      case 'tools/call':
        const { name, arguments: args } = params
        try {
          const result = await callTool(name, args, user.id)
          return NextResponse.json({ result })
        } catch (error) {
          return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
          )
        }

      case 'prompts/list':
        const prompts = listPrompts()
        return NextResponse.json({ result: { prompts } })

      case 'prompts/get':
        const { name: promptName, arguments: promptArgs } = params
        try {
          const prompt = await getPrompt(promptName, promptArgs, user.id)
          return NextResponse.json({ result: prompt })
        } catch (error) {
          return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          { error: `Unknown method: ${method}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in  shared server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 支持 GET 请求获取服务器信息
export async function GET() {
  const serverInfo = await getServerInfo()
  return NextResponse.json(serverInfo)
}

