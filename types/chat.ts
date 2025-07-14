export interface ChatSource {
  title: string
  source: string
  snippet: string
  url?: string
  id?: string
  relevancy?: number
  similarity?: number
}

export interface ToolResult {
  toolName: string
  success: boolean
  error?: string
  result?: any
}

export type Message = {
  content: string
  sources: ChatSource[]
  toolResults: ToolResult[]
  response: string
}
