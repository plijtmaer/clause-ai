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

// Enhanced types for Legal Document Analysis
export interface AnalysisSection {
  found: boolean
  details: string[]
  score: number
}

export interface LegalDocumentAnalysis {
  dataCollection: AnalysisSection
  userRights: AnalysisSection
  dataSharing: AnalysisSection
  security: AnalysisSection
  contractTerms?: AnalysisSection
  confidentialityTerms?: AnalysisSection
}

export interface ScoreBreakdown {
  score: number
  maxScore: number
  description: string
}

export interface ComprehensiveScore {
  overallScore: number
  rating: string
  color: string
  breakdown: {
    dataCollection: ScoreBreakdown
    userRights: ScoreBreakdown
    dataSharing: ScoreBreakdown
    security: ScoreBreakdown
    contractTerms?: ScoreBreakdown
    confidentialityTerms?: ScoreBreakdown
  }
  riskFactors: string[]
  riskPenalty: number
  recommendations: string[]
}

export interface DocumentAnalysis {
  documentType: "terms" | "privacy" | "legal" | "nda" | "contract" | "eula" | "cookies"
  wordCount: number
  readingTimeMinutes: number
  summary: string
  keySections: string[]
  analysis: LegalDocumentAnalysis
  riskFactors: string[]
}

export interface FetchedDocument {
  success: boolean
  url: string
  title: string
  documentType: "terms" | "privacy" | "legal" | "nda" | "contract" | "eula" | "cookies"
  content: string
  wordCount: number
  readingTimeMinutes: number
}

// Risk Assessment Types
export interface RiskFactor {
  level: "High" | "Medium" | "Low"
  description: string
  category: "data" | "security" | "terms" | "privacy"
}

export interface DocumentRisk {
  overallRisk: "High" | "Medium" | "Low"
  factors: RiskFactor[]
  recommendations: string[]
}

// Document Type Specific Types
export interface NDAnalysis extends DocumentAnalysis {
  documentType: "nda"
  confidentialityScope: string[]
  restrictionPeriod: string
  obligations: string[]
}

export interface ContractAnalysis extends DocumentAnalysis {
  documentType: "contract"
  obligations: string[]
  liabilityTerms: string[]
  terminationClauses: string[]
  paymentTerms: string[]
}

export interface PrivacyPolicyAnalysis extends DocumentAnalysis {
  documentType: "privacy"
  dataTypes: string[]
  retentionPeriod: string
  userRights: string[]
  thirdPartySharing: string[]
}

// Legacy types for backward compatibility
export interface TermsAnalysis extends LegalDocumentAnalysis {}
export interface PrivacyScore extends ComprehensiveScore {}
export interface PrivacyScoreBreakdown extends ScoreBreakdown {}
