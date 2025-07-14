import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { urlContentFetcherTool, termsAnalyzerTool, privacyPolicyScorerTool, directTextAnalyzerTool } from "@/lib/tools"

export async function POST(request: Request) {
  try {
    const { message, mode } = await request.json()

    // Use Terms Analysis tools
    const tools = {
      urlContentFetcher: urlContentFetcherTool,
      directTextAnalyzer: directTextAnalyzerTool,
      termsAnalyzer: termsAnalyzerTool,
      privacyPolicyScorer: privacyPolicyScorerTool,
    }

    const systemPrompt = `You are Clause AI, a specialized legal document analyzer that helps users understand complex legal agreements. You excel at analyzing Privacy Policies, Terms of Service, NDAs, Contracts, EULAs, and other legal documents to make them accessible and understandable.

CORE CAPABILITIES:
1. urlContentFetcher: Fetch and extract content from any legal document URL
2. directTextAnalyzer: Process legal document text that has been pasted directly
3. termsAnalyzer: Deep analysis of legal content to identify key clauses, risks, and practices
4. privacyPolicyScorerTool: Generate comprehensive scores and recommendations

INPUT DETECTION:
- If the user input starts with "http://" or "https://", use urlContentFetcher
- If the user input is a large block of text (>100 words) or contains legal language, use directTextAnalyzer
- If the user input is a short request or question, ask for clarification about what document they want to analyze

DOCUMENT TYPES SUPPORTED:
- Privacy Policies: Data collection, user rights, sharing practices
- Terms of Service: User obligations, platform rights, liability
- NDAs: Confidentiality scope, restrictions, obligations
- Contracts: Obligations, liability, termination clauses
- EULAs: Software rights, restrictions, warranties
- Cookie Policies: Tracking, consent, data usage

ANALYSIS WORKFLOW:
1. INPUT PROCESSING: 
   - For URLs: Use urlContentFetcher to extract content
   - For pasted text: Use directTextAnalyzer to process content
2. ANALYZE: Comprehensive analysis covering:
   - Data collection practices and transparency
   - User rights and control mechanisms
   - Third-party sharing and partnerships
   - Security measures and breach protocols
   - Risk factors and concerning clauses
   - Contract-specific terms (for contracts/NDAs)
   - Confidentiality terms (for NDAs)

3. SCORE: Generate weighted scores based on document type:
   - Privacy Policies: Focus on data protection and user rights
   - Terms of Service: Balance user protection with platform needs
   - NDAs: Emphasis on confidentiality scope and fairness
   - Contracts: Focus on obligations and liability balance

4. SUMMARIZE: Provide clear, actionable insights including:
   - Document summary in plain language
   - Key findings and important clauses
   - Risk assessment with specific concerns
   - Comprehensive scoring with breakdown
   - Practical recommendations for users

SCORING WEIGHTS (vary by document type):
- Privacy Policies: User Rights (35%), Data Collection (25%), Data Sharing (25%), Security (15%)
- Terms of Service: User Rights (30%), Data Sharing (30%), Data Collection (20%), Security (20%)
- NDAs: Data Sharing (35%), Security (30%), User Rights (20%), Data Collection (15%)
- Contracts: Security (35%), Data Sharing (30%), User Rights (25%), Data Collection (10%)

RESPONSE STYLE:
- Be direct and informative, not conversational
- Use clear, jargon-free language
- Highlight important risks and red flags
- Provide specific, actionable recommendations
- Focus on what users need to know to make informed decisions
- Always include the comprehensive score and breakdown

RISK ASSESSMENT:
Identify and flag high-risk terms like:
- Unlimited liability or broad termination rights
- Excessive data collection without clear purpose
- Broad sharing with third parties
- Weak security measures or breach protocols
- Unfair contract terms or indefinite obligations

Remember: Your goal is to empower users with clear, accurate information about what they're agreeing to when they accept legal documents.`

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      tools: tools,
      maxSteps: 5,
    })

    // Extract sources and tool results for the frontend
    const sources: any[] = []
    const toolResults: any[] = []

    // Process tool calls and results
    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const toolCall of step.toolCalls) {
            if (toolCall.type === "tool-call") {
              toolResults.push({
                toolName: toolCall.toolName,
                result: toolCall.args,
                success: true,
                error: undefined,
              })
            }
          }
        }

        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const existingIndex = toolResults.findIndex((tr) => tr.toolName === toolResult.toolName)
            if (existingIndex >= 0) {
              toolResults[existingIndex] = {
                toolName: toolResult.toolName,
                result: toolResult.result,
                success: !toolResult.result?.error,
                error: toolResult.result?.error,
              }
            } else {
              toolResults.push({
                toolName: toolResult.toolName,
                result: toolResult.result,
                success: !toolResult.result?.error,
                error: toolResult.result?.error,
              })
            }

            // Extract sources from URL content fetcher
            if (
              toolResult.toolName === "urlContentFetcher" &&
              toolResult.result &&
              typeof toolResult.result === "object" &&
              "success" in toolResult.result &&
              toolResult.result.success
            ) {
              const result = toolResult.result as any
              if (result.url) {
                sources.push({
                  title: result.title || "Legal Document",
                  snippet: `${result.documentType} document (${result.wordCount} words, ~${result.readingTimeMinutes} min read)`,
                  url: result.url,
                  source: result.documentType === "privacy" ? "Privacy Policy" : "Terms of Service",
                })
              }
            }

            // Extract sources from direct text analyzer
            if (
              toolResult.toolName === "directTextAnalyzer" &&
              toolResult.result &&
              typeof toolResult.result === "object" &&
              "success" in toolResult.result &&
              toolResult.result.success
            ) {
              const result = toolResult.result as any
              sources.push({
                title: result.title || "Pasted Legal Document",
                snippet: `${result.documentType} document (${result.wordCount} words, ~${result.readingTimeMinutes} min read)`,
                url: "#pasted-text",
                source: "Pasted Text",
              })
            }

            // Extract analysis results as sources
            if (
              toolResult.toolName === "termsAnalyzer" &&
              toolResult.result &&
              typeof toolResult.result === "object" &&
              "success" in toolResult.result &&
              toolResult.result.success
            ) {
              const result = toolResult.result as any
              sources.push({
                title: `Analysis Results`,
                snippet: `Analyzed ${result.documentType} document with ${result.wordCount} words`,
                url: "#analysis",
                source: "Analysis",
              })
            }

            // Extract privacy score as source
            if (
              toolResult.toolName === "privacyPolicyScorer" &&
              toolResult.result &&
              typeof toolResult.result === "object" &&
              "success" in toolResult.result &&
              toolResult.result.success
            ) {
              const result = toolResult.result as any
              sources.push({
                title: `Privacy Score: ${result.overallScore}/100`,
                snippet: `Rating: ${result.rating} - ${result.recommendations?.length || 0} recommendations`,
                url: "#score",
                source: "Privacy Score",
              })
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        response: result.text,
        sources: sources,
        toolResults: toolResults,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
