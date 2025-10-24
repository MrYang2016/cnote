/**
 * DeepSeek LLM Client
 * Integration with DeepSeek API for chat functionality
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// Initialize DeepSeek client (using OpenAI SDK with custom base URL)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL!,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResult {
  content: string | null;
  toolCalls?: ToolCall[];
  finishReason: string;
}

/**
 * Generate chat completion using DeepSeek
 * @param messages - Array of chat messages
 * @param systemPrompt - Optional system prompt
 * @returns Assistant's response
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  try {
    const messagesWithSystem: ChatMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from DeepSeek');
    }

    return assistantMessage;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw new Error('Failed to generate chat response');
  }
}

/**
 * Generate chat completion with function calling support
 * @param messages - Array of chat messages
 * @param tools - Available tools for the LLM to call
 * @param systemPrompt - Optional system prompt
 * @returns Chat completion result with potential tool calls
 */
export async function generateChatCompletionWithTools(
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
  systemPrompt?: string
): Promise<ChatCompletionResult> {
  try {
    const messagesWithSystem: ChatCompletionMessageParam[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messagesWithSystem,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto', // Let the model decide when to use tools
      temperature: 0.7,
      max_tokens: 2000,
    });

    const choice = response.choices[0];
    const message = choice.message;

    return {
      content: message.content,
      toolCalls: message.tool_calls as ToolCall[] | undefined,
      finishReason: choice.finish_reason,
    };
  } catch (error) {
    console.error('Error generating chat completion with tools:', error);
    throw new Error('Failed to generate chat response with tools');
  }
}

/**
 * Generate streaming chat completion
 * @param messages - Array of chat messages
 * @param systemPrompt - Optional system prompt
 * @returns Async generator of response chunks
 */
export async function* generateStreamingChatCompletion(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const messagesWithSystem: ChatMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const stream = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error generating streaming chat:', error);
    throw new Error('Failed to generate streaming chat response');
  }
}

