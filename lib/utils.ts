import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips markdown syntax from text
 * Removes headers, bold, italic, links, images, code blocks, etc.
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove bold and italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+(.+)$/gm, '$1')
    // Remove horizontal rules
    .replace(/^---$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+(.+)$/gm, '$1')
    .replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim()
}
