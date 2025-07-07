import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { 
  urlContentFetcherTool,
  termsAnalyzerTool,
  privacyPolicyScorerTool
} from "@/lib/tools";

export async function POST(request: Request) {
  try {
    const { message, mode } = await request.json();
    
    // Use Terms Analysis tools
    const tools = {
      urlContentFetcher: urlContentFetcherTool,
      termsAnalyzer: termsAnalyzerTool,
      privacyPolicyScorer: privacyPolicyScorerTool,
    };
    
    const systemPrompt = `You are a Privacy Policy and Terms of Service Analyzer AI assistant. You specialize in analyzing legal documents to help users understand what they're agreeing to. You have access to these tools:

1. urlContentFetcher: Fetch and extract content from Terms of Service, Privacy Policy, or legal document URLs
2. termsAnalyzer: Analyze the content to identify data collection practices, user rights, data sharing, and security measures
3. privacyPolicyScorer: Generate a comprehensive privacy score based on the analysis

WORKFLOW:
- When users provide a URL to terms of service or privacy policy, fetch the content first
- Analyze the content to extract key information about data collection, user rights, data sharing, and security
- Generate a privacy score based on the analysis
- Provide a clear, user-friendly summary that explains:
  * What the document is about
  * What data they collect
  * What rights users have
  * How data is shared
  * Security measures
  * An overall privacy score and rating

SCORING CRITERIA:
- Data Collection (25%): Transparency and reasonableness of data collection
- User Rights (30%): Clear user control and rights protection
- Data Sharing (25%): Limited and transparent third-party sharing
- Security (20%): Strong security measures and breach protections

Be helpful, clear, and focus on making complex legal language accessible to everyday users. Always provide actionable insights and recommendations.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      tools: tools,
      maxSteps: 5,
    });

    // Extract sources and tool results for the frontend
    const sources: any[] = [];
    const toolResults: any[] = [];

    // Process tool calls and results
    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const toolCall of step.toolCalls) {
            if (toolCall.type === 'tool-call') {
              toolResults.push({
                toolName: toolCall.toolName,
                result: toolCall.args,
                success: true,
                error: undefined,
              });
            }
          }
        }
        
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const existingIndex = toolResults.findIndex(tr => tr.toolName === toolResult.toolName);
            if (existingIndex >= 0) {
              toolResults[existingIndex] = {
                toolName: toolResult.toolName,
                result: toolResult.result,
                success: !toolResult.result?.error,
                error: toolResult.result?.error,
              };
            } else {
              toolResults.push({
                toolName: toolResult.toolName,
                result: toolResult.result,
                success: !toolResult.result?.error,
                error: toolResult.result?.error,
              });
            }

            // Extract sources from URL content fetcher
            if (toolResult.toolName === 'urlContentFetcher' && toolResult.result && typeof toolResult.result === 'object' && 'success' in toolResult.result && toolResult.result.success) {
              const result = toolResult.result as any;
              if (result.url) {
                sources.push({
                  title: result.title || 'Legal Document',
                  snippet: `${result.documentType} document (${result.wordCount} words, ~${result.readingTimeMinutes} min read)`,
                  url: result.url,
                  source: result.documentType === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
                });
              }
            }

            // Extract analysis results as sources
            if (toolResult.toolName === 'termsAnalyzer' && toolResult.result && typeof toolResult.result === 'object' && 'success' in toolResult.result && toolResult.result.success) {
              const result = toolResult.result as any;
              sources.push({
                title: `Analysis Results`,
                snippet: `Analyzed ${result.documentType} document with ${result.wordCount} words`,
                url: '#analysis',
                source: 'Analysis',
              });
            }

            // Extract privacy score as source
            if (toolResult.toolName === 'privacyPolicyScorer' && toolResult.result && typeof toolResult.result === 'object' && 'success' in toolResult.result && toolResult.result.success) {
              const result = toolResult.result as any;
              sources.push({
                title: `Privacy Score: ${result.overallScore}/100`,
                snippet: `Rating: ${result.rating} - ${result.recommendations?.length || 0} recommendations`,
                url: '#score',
                source: 'Privacy Score',
              });
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
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
