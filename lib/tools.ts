import { z } from "zod";
import { tool } from "ai";
import * as cheerio from "cheerio";

// ===== TERMS & CONDITIONS ANALYSIS TOOLS =====

// URL Content Fetcher Tool
export const urlContentFetcherTool = tool({
  description: "Fetch and extract text content from terms of service, privacy policy, or legal document URLs",
  parameters: z.object({
    url: z.string().describe("The URL of the terms of service or privacy policy document"),
    documentType: z.enum(["terms", "privacy", "legal"]).optional().default("terms").describe("Type of document being fetched"),
  }),
  execute: async ({ url, documentType }) => {
    try {
      console.log(`Content fetch requested for: "${url}"`);
      
      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
      }
      
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style, nav, header, footer, aside, .navigation, .menu, .sidebar').remove();
      
      // Try to find the main content area
      let content = '';
      const mainSelectors = [
        'main', 
        '[role="main"]', 
        '.main-content', 
        '.content', 
        '.terms-content', 
        '.privacy-content',
        '.legal-content',
        'article',
        '.document',
        '.policy'
      ];
      
      for (const selector of mainSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 500) break;
        }
      }
      
      // Fallback to body content if no main content found
      if (!content || content.length < 500) {
        content = $('body').text().trim();
      }
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
        .trim();
      
      // Extract basic metadata
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Legal Document';
      const wordCount = content.split(/\s+/).length;
      
      return {
        success: true,
        url,
        title,
        documentType,
        content,
        wordCount,
        readingTimeMinutes: Math.ceil(wordCount / 200),
        message: `Successfully fetched ${documentType} document from ${url} (${wordCount} words)`
      };
    } catch (error) {
      console.error("Content fetch error:", error);
      
      return {
        success: false,
        url,
        documentType,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to fetch content from ${url}`
      };
    }
  },
});

// Terms and Conditions Analyzer Tool
export const termsAnalyzerTool = tool({
  description: "Analyze terms of service or privacy policy content to extract key information, data collection practices, and user rights",
  parameters: z.object({
    content: z.string().describe("The content of the terms of service or privacy policy to analyze"),
    documentType: z.enum(["terms", "privacy", "legal"]).optional().default("terms").describe("Type of document being analyzed"),
  }),
  execute: async ({ content, documentType }) => {
    try {
      const wordCount = content.trim().split(/\s+/).length;
      
      // Key phrases to look for in terms and privacy policies
      const dataCollectionKeywords = [
        'personal information', 'personal data', 'collect', 'gather', 'obtain',
        'email address', 'ip address', 'location', 'cookies', 'tracking',
        'analytics', 'usage data', 'device information', 'browsing history',
        'payment information', 'credit card', 'financial information'
      ];
      
      const userRightsKeywords = [
        'delete', 'remove', 'access', 'modify', 'correct', 'update',
        'opt-out', 'unsubscribe', 'right to', 'data protection',
        'privacy rights', 'user control', 'request information'
      ];
      
      const sharingKeywords = [
        'third party', 'share', 'disclose', 'transfer', 'sell',
        'partner', 'affiliate', 'vendor', 'service provider',
        'advertiser', 'marketing', 'business transfer'
      ];
      
      const securityKeywords = [
        'security', 'encrypt', 'secure', 'protect', 'safeguard',
        'ssl', 'https', 'data breach', 'unauthorized access'
      ];
      
             // Analyze content for different aspects
       const dataCollection = findRelevantSections(content, dataCollectionKeywords);
       const userRights = findRelevantSections(content, userRightsKeywords);
       const dataSharing = findRelevantSections(content, sharingKeywords);
       const security = findRelevantSections(content, securityKeywords);
       
       // Generate summary
       const summary = generateSummary(content, documentType);
       
       // Extract key sections
       const keySections = extractKeySections(content);
      
      return {
        success: true,
        documentType,
        wordCount,
        readingTimeMinutes: Math.ceil(wordCount / 200),
        summary,
        keySections,
        analysis: {
                     dataCollection: {
             found: dataCollection.length > 0,
             details: dataCollection,
             score: calculateScore(dataCollection, 'data_collection')
           },
           userRights: {
             found: userRights.length > 0,
             details: userRights,
             score: calculateScore(userRights, 'user_rights')
           },
           dataSharing: {
             found: dataSharing.length > 0,
             details: dataSharing,
             score: calculateScore(dataSharing, 'data_sharing')
           },
           security: {
             found: security.length > 0,
             details: security,
             score: calculateScore(security, 'security')
           }
        },
        message: `Successfully analyzed ${documentType} document (${wordCount} words)`
      };
    } catch (error) {
      console.error("Terms analysis error:", error);
      
      return {
        success: false,
        documentType,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to analyze ${documentType} document`
      };
    }
  },
  
  // Helper methods would be implemented here but since we're in a tool context,
  // we'll implement them inline in the execute function
});

// Privacy Policy Scorer Tool
export const privacyPolicyScorerTool = tool({
  description: "Assign a privacy score to a document based on user-friendliness, transparency, and data protection practices",
  parameters: z.object({
    analysisResults: z.object({
      dataCollection: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      }),
      userRights: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      }),
      dataSharing: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      }),
      security: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      })
    }).describe("Analysis results from the terms analyzer"),
    documentType: z.enum(["terms", "privacy", "legal"]).optional().default("privacy").describe("Type of document being scored"),
  }),
  execute: async ({ analysisResults, documentType }) => {
    try {
      const { dataCollection, userRights, dataSharing, security } = analysisResults;
      
      // Calculate overall score (0-100)
      let overallScore = 0;
      let maxScore = 100;
      
      // Data Collection Score (25% of total)
      const dataCollectionScore = dataCollection.found ? 
        (dataCollection.score >= 7 ? 25 : Math.max(5, dataCollection.score * 3)) : 10;
      
      // User Rights Score (30% of total)
      const userRightsScore = userRights.found ? 
        (userRights.score >= 7 ? 30 : Math.max(5, userRights.score * 4)) : 5;
      
      // Data Sharing Score (25% of total) - Lower score if extensive sharing
      const dataSharingScore = dataSharing.found ? 
        (dataSharing.score <= 3 ? 25 : Math.max(5, 30 - dataSharing.score * 3)) : 15;
      
      // Security Score (20% of total)
      const securityScore = security.found ? 
        (security.score >= 7 ? 20 : Math.max(5, security.score * 2.5)) : 10;
      
      overallScore = Math.round(dataCollectionScore + userRightsScore + dataSharingScore + securityScore);
      
      // Determine rating
      let rating: string;
      let color: string;
      
      if (overallScore >= 80) {
        rating = "Excellent";
        color = "green";
      } else if (overallScore >= 65) {
        rating = "Good";
        color = "blue";
      } else if (overallScore >= 50) {
        rating = "Fair";
        color = "yellow";
      } else if (overallScore >= 35) {
        rating = "Poor";
        color = "orange";
      } else {
        rating = "Very Poor";
        color = "red";
      }
      
      // Generate recommendations
      const recommendations = [];
      
      if (dataCollection.score < 7) {
        recommendations.push("Improve transparency about data collection practices");
      }
      if (userRights.score < 7) {
        recommendations.push("Clearly outline user rights and how to exercise them");
      }
      if (dataSharing.score > 5) {
        recommendations.push("Reduce third-party data sharing or improve disclosure");
      }
      if (security.score < 7) {
        recommendations.push("Strengthen security measures and disclosures");
      }
      
      return {
        success: true,
        documentType,
        overallScore,
        rating,
        color,
        breakdown: {
          dataCollection: {
            score: dataCollectionScore,
            maxScore: 25,
            description: "Transparency in data collection practices"
          },
          userRights: {
            score: userRightsScore,
            maxScore: 30,
            description: "User control and rights protection"
          },
          dataSharing: {
            score: dataSharingScore,
            maxScore: 25,
            description: "Third-party data sharing practices"
          },
          security: {
            score: securityScore,
            maxScore: 20,
            description: "Security measures and protection"
          }
        },
        recommendations,
        message: `Generated privacy score: ${overallScore}/100 (${rating})`
      };
    } catch (error) {
      console.error("Privacy scoring error:", error);
      
      return {
        success: false,
        documentType,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to generate privacy score`
      };
    }
  },
});

// Helper functions that would be used in the tools
function findRelevantSections(content: string, keywords: string[]): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const relevant: string[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const matchCount = keywords.filter(keyword => 
      lowerSentence.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      relevant.push(sentence.trim());
    }
  }
  
  return relevant.slice(0, 5); // Return top 5 relevant sections
}

function generateSummary(content: string, documentType: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const summarySentences = sentences.slice(0, 3);
  
  return summarySentences.join('. ') + '.';
}

function extractKeySections(content: string): string[] {
  const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 100);
  return sections.slice(0, 5);
}

function calculateScore(details: string[], category: string): number {
  const baseScore = details.length > 0 ? Math.min(details.length * 2, 10) : 0;
  
  // Adjust based on category
  switch (category) {
    case 'data_collection':
      return Math.min(baseScore, 8); // Cap at 8 for data collection
    case 'user_rights':
      return Math.min(baseScore + 2, 10); // Boost user rights
    case 'data_sharing':
      return Math.max(baseScore, 3); // Ensure minimum score for sharing
    case 'security':
      return Math.min(baseScore + 1, 10); // Slight boost for security
    default:
      return baseScore;
  }
} 