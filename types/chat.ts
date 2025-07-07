export interface ChatSource {
  title: string
  snippet?: string
  url?: string
  source?: string
}

export interface ToolResult {
  toolName: string
  result: any
  success: boolean
  error?: string
}

export interface Message {
  content: string
  sources?: ChatSource[]
  toolResults?: ToolResult[]
  response?: string
}

export interface ToolInvocation {
  toolCallId: string
  toolName: string
  args: any
  result: any
  state: "success" | "error" | "pending"
}

export interface ChatMessageWithSources {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: ChatSource[]
  toolInvocations?: ToolInvocation[]
  createdAt: string | Date
}

// New types for Terms Analysis
export interface AnalysisSection {
  found: boolean
  details: string[]
  score: number
}

export interface TermsAnalysis {
  dataCollection: AnalysisSection
  userRights: AnalysisSection
  dataSharing: AnalysisSection
  security: AnalysisSection
}

export interface PrivacyScoreBreakdown {
  score: number
  maxScore: number
  description: string
}

export interface PrivacyScore {
  overallScore: number
  rating: string
  color: string
  breakdown: {
    dataCollection: PrivacyScoreBreakdown
    userRights: PrivacyScoreBreakdown
    dataSharing: PrivacyScoreBreakdown
    security: PrivacyScoreBreakdown
  }
  recommendations: string[]
}

export interface DocumentAnalysis {
  documentType: "terms" | "privacy" | "legal"
  wordCount: number
  readingTimeMinutes: number
  summary: string
  keySections: string[]
  analysis: TermsAnalysis
}

export interface FetchedDocument {
  success: boolean
  url: string
  title: string
  documentType: "terms" | "privacy" | "legal"
  content: string
  wordCount: number
  readingTimeMinutes: number
}
