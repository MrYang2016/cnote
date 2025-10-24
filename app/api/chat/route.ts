/**
 * Chat API Route with Function Calling
 * POST: Send a message and get AI response with MCP tool integration
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getChatMessages, saveChatMessage } from '@/lib/db/chat';
import { generateChatCompletionWithTools } from '@/lib/llm/deepseek';
import { handleError } from '@/lib/utils/errors';
import { z } from 'zod';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// Import MCP tools
import {
  listTools as listPrivateTools,
  callTool as callPrivateTool
} from '@/lib/mcp/private-server';
import {
  listTools as listSharedTools,
  callTool as callSharedTool
} from '@/lib/mcp/shared-server';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

/**
 * Convert MCP tool format to OpenAI function calling format
 */
function convertMCPToolsToOpenAI(mcpTools: any[], prefix: string): ChatCompletionTool[] {
  return mcpTools.map(tool => ({
    type: 'function' as const,
    function: {
      name: `${prefix}_${tool.name}`,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

/**
 * Execute MCP tool call
 */
async function executeMCPTool(
  toolName: string,
  args: any,
  userId: string
): Promise<any> {
  // Determine if it's a private or shared tool
  if (toolName.startsWith('private_')) {
    const actualToolName = toolName.replace('private_', '');
    return await callPrivateTool(actualToolName, args, userId);
  } else if (toolName.startsWith('shared_')) {
    const actualToolName = toolName.replace('shared_', '');
    return await callSharedTool(actualToolName, args, userId);
  } else {
    throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = chatSchema.parse(body);

    // Save user message
    await saveChatMessage(user.id, 'user', message);

    // Get recent chat history for context
    const recentMessages = await getChatMessages(user.id, 10);

    // Build system prompt for function calling
    const systemPrompt = `You are a helpful AI assistant for a note-taking application. 
You have access to tools that can search and retrieve information from:
1. The user's personal notes (via private_ tools)
2. Notes that have been shared with the user by friends (via shared_ tools)

When a user asks a question:
- Decide if you need to use tools to search for relevant information
- You can call multiple tools if needed (e.g., search both personal and shared notes)
- Use the information retrieved from tools to provide helpful, accurate answers
- Clearly indicate the source of information (personal note vs shared note)
- If you don't find relevant information, say so honestly

Guidelines:
- Be concise and helpful
- Reference specific notes when applicable  
- For shared notes, mention who shared them (e.g., "According to a note shared by @username...")
- Provide actionable suggestions when appropriate`;

    // Prepare available tools (private + shared MCP tools)
    const privateTools = listPrivateTools();
    const sharedTools = listSharedTools();

    const availableTools: ChatCompletionTool[] = [
      ...convertMCPToolsToOpenAI(privateTools, 'private'),
      ...convertMCPToolsToOpenAI(sharedTools, 'shared'),
    ];

    // Prepare messages for LLM
    const messages: ChatCompletionMessageParam[] = recentMessages
      .filter((msg) => msg.role !== 'system')
      .slice(-6) // Last 6 messages for context
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Initial LLM call with tools
    let response = await generateChatCompletionWithTools(
      messages,
      availableTools,
      systemPrompt
    );

    // Handle tool calls (may require multiple iterations)
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops
    const toolCallResults: Array<{ tool: string; result: any }> = [];

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxIterations) {
      iterations++;

      // Add assistant message with tool calls to conversation
      messages.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls as any,
      });

      // Execute all tool calls
      const toolResults = await Promise.all(
        response.toolCalls.map(async (toolCall) => {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeMCPTool(
              toolCall.function.name,
              args,
              user.id
            );

            toolCallResults.push({
              tool: toolCall.function.name,
              result,
            });

            return {
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            };
          } catch (error) {
            console.error('Tool execution error:', error);
            return {
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: (error as Error).message
              }),
            };
          }
        })
      );

      // Add tool results to conversation
      messages.push(...toolResults);

      // Get next response from LLM
      response = await generateChatCompletionWithTools(
        messages,
        availableTools,
        systemPrompt
      );
    }

    // Final assistant message
    const finalMessage = response.content || 'I apologize, but I was unable to generate a response.';

    // Save assistant message
    await saveChatMessage(user.id, 'assistant', finalMessage);

    return NextResponse.json({
      message: finalMessage,
      toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * GET /api/chat
 * Get chat history
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await getChatMessages(user.id);

    return NextResponse.json({ messages });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * DELETE /api/chat
 * Clear chat history
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clearChatHistory } = await import('@/lib/db/chat');
    await clearChatHistory(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

