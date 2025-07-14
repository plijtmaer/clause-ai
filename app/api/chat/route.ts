import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { urlContentFetcherTool, termsAnalyzerTool, privacyPolicyScorerTool, directTextAnalyzerTool } from "@/lib/tools"

// Progress tracking interface
interface ProgressStep {
  step: number
  total: number
  message: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

export async function POST(request: Request) {
  try {
    const { message, mode } = await request.json()
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 second timeout

    // DETERMINISTIC FLOW - No dependency on AI model decisions
    const isUrl = message.startsWith('http://') || message.startsWith('https://')
    const isLongText = message.split(/\s+/).length > 100
    
    // Progress tracking
    const sendProgress = (step: ProgressStep) => {
      // In a real implementation, this would use Server-Sent Events or WebSockets
      console.log(`Progress: ${step.step}/${step.total} - ${step.message}`)
    }

    let documentContent = ""
    let documentType = "terms"
    let analysisResult: any = null
    let scoreResult: any = null
    
    // STEP 1: Content Extraction
    sendProgress({ step: 1, total: 4, message: "Extracting document content...", status: 'in_progress' })
    
    try {
      if (isUrl) {
        const urlResult = await urlContentFetcherTool.execute({ url: message, documentType: "terms" })
        if (urlResult.success) {
          documentContent = urlResult.content
          documentType = urlResult.documentType
          sendProgress({ step: 1, total: 4, message: "Document content extracted successfully", status: 'completed' })
        } else {
          throw new Error(urlResult.error || "Failed to fetch URL content")
        }
      } else if (isLongText) {
        const textResult = await directTextAnalyzerTool.execute({ content: message, documentType: "terms" })
        if (textResult.success) {
          documentContent = textResult.content
          documentType = textResult.documentType
          sendProgress({ step: 1, total: 4, message: "Text content processed successfully", status: 'completed' })
        } else {
          throw new Error(textResult.error || "Failed to process text content")
        }
      } else {
        throw new Error("Please provide a valid URL or paste the document text (minimum 100 words)")
      }
    } catch (error) {
      sendProgress({ step: 1, total: 4, message: "Failed to extract content", status: 'error' })
      throw error
    }

    // STEP 2: Document Analysis
    sendProgress({ step: 2, total: 4, message: "Analyzing document structure and content...", status: 'in_progress' })
    
    try {
      analysisResult = await termsAnalyzerTool.execute({ content: documentContent, documentType: documentType as any })
      if (analysisResult.success) {
        sendProgress({ step: 2, total: 4, message: "Document analysis completed", status: 'completed' })
      } else {
        throw new Error(analysisResult.error || "Failed to analyze document")
      }
    } catch (error) {
      sendProgress({ step: 2, total: 4, message: "Document analysis failed", status: 'error' })
      throw error
    }

    // STEP 3: Privacy/Legal Scoring
    sendProgress({ step: 3, total: 4, message: "Calculating privacy and legal scores...", status: 'in_progress' })
    
    try {
      scoreResult = await privacyPolicyScorerTool.execute({ 
        analysisResults: analysisResult.analysis,
        documentType: documentType as any
      })
      if (scoreResult.success) {
        sendProgress({ step: 3, total: 4, message: "Scoring completed", status: 'completed' })
      } else {
        throw new Error(scoreResult.error || "Failed to calculate scores")
      }
    } catch (error) {
      sendProgress({ step: 3, total: 4, message: "Scoring failed", status: 'error' })
      throw error
    }

    // STEP 4: Generate Final Summary
    sendProgress({ step: 4, total: 4, message: "Generating final summary...", status: 'in_progress' })
    
    try {
      const systemPrompt = `You are Clause AI, a legal document analyzer. Based on the analysis results provided, create a comprehensive but concise summary.

DOCUMENT TYPE: ${documentType}
WORD COUNT: ${analysisResult.wordCount}
READING TIME: ${analysisResult.readingTimeMinutes} minutes

Your response should be structured as follows:
1. **Document Summary**: Brief overview of what this document covers
2. **Key Findings**: Most important clauses and provisions
3. **Risk Assessment**: High and medium risk factors identified
4. **Privacy Score**: Overall score with breakdown
5. **Recommendations**: Specific advice for users

Be direct, informative, and focus on what users need to know to make informed decisions.`

      const summaryResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this legal document analysis:

ANALYSIS RESULTS:
${JSON.stringify(analysisResult, null, 2)}

SCORE RESULTS:
${JSON.stringify(scoreResult, null, 2)}

Create a comprehensive summary that helps users understand what they're agreeing to.` },
        ],
        abortSignal: controller.signal,
      })
      
      sendProgress({ step: 4, total: 4, message: "Analysis complete", status: 'completed' })
      
      // Clear timeout on successful completion
      clearTimeout(timeoutId)

      // Prepare sources for frontend
      const sources = []
      
      if (isUrl) {
        sources.push({
          title: analysisResult.title || "Legal Document",
          snippet: `${documentType} document (${analysisResult.wordCount} words, ~${analysisResult.readingTimeMinutes} min read)`,
          url: message,
          source: documentType === "privacy" ? "Privacy Policy" : "Terms of Service",
        })
      } else {
        sources.push({
          title: "Pasted Legal Document",
          snippet: `${documentType} document (${analysisResult.wordCount} words, ~${analysisResult.readingTimeMinutes} min read)`,
          url: "#pasted-text",
          source: "Pasted Text",
        })
      }

      sources.push({
        title: `Privacy Score: ${scoreResult.overallScore}/100`,
        snippet: `Rating: ${scoreResult.rating} - ${scoreResult.recommendations?.length || 0} recommendations`,
        url: "#score",
        source: "Privacy Score",
      })

      // Prepare tool results for frontend
      const toolResults = [
        {
          toolName: isUrl ? "urlContentFetcher" : "directTextAnalyzer",
          result: analysisResult,
          success: true,
          error: undefined,
        },
        {
          toolName: "termsAnalyzer",
          result: analysisResult,
          success: true,
          error: undefined,
        },
        {
          toolName: "privacyPolicyScorer",
          result: scoreResult,
          success: true,
          error: undefined,
        }
      ]

      return new Response(
        JSON.stringify({
          response: summaryResult.text,
          sources: sources,
          toolResults: toolResults,
          progress: { step: 4, total: 4, message: "Analysis complete", status: 'completed' }
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
      
    } catch (error) {
      sendProgress({ step: 4, total: 4, message: "Failed to generate summary", status: 'error' })
      throw error
    }
    
  } catch (error) {
    console.error("Chat API error:", error)
    
    // Handle specific error types
    let errorMessage = "Failed to process request"
    let status = 500
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again with a shorter document."
        status = 408
      } else if (error.message.includes('fetch')) {
        errorMessage = "Unable to fetch the document. Please check the URL and try again."
        status = 400
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        status = 429
      } else {
        errorMessage = error.message
      }
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        progress: { step: 0, total: 4, message: "Error occurred", status: 'error' }
      }),
      {
        status: status,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
