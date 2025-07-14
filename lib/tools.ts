import { z } from "zod";
import { tool } from "ai";
import * as cheerio from "cheerio";

// ===== LEGAL DOCUMENT ANALYSIS TOOLS =====

// URL Content Fetcher Tool
export const urlContentFetcherTool = tool({
  description: "Fetch and extract text content from terms of service, privacy policy, NDAs, contracts, or any legal document URLs",
  parameters: z.object({
    url: z.string().describe("The URL of the legal document to analyze"),
    documentType: z.enum(["terms", "privacy", "legal", "nda", "contract", "eula", "cookies"]).optional().default("terms").describe("Type of document being fetched"),
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
      
      // Try to find the main content area with more comprehensive selectors
      let content = '';
      const mainSelectors = [
        'main', 
        '[role="main"]', 
        '.main-content', 
        '.content', 
        '.terms-content', 
        '.privacy-content',
        '.legal-content',
        '.policy-content',
        '.document-content',
        '.contract-content',
        '.nda-content',
        'article',
        '.document',
        '.policy',
        '.legal-text',
        '.terms-text',
        '.privacy-text',
        '.agreement',
        '.contract',
        '.eula',
        '.cookie-policy',
        '[class*="terms"]',
        '[class*="privacy"]',
        '[class*="legal"]',
        '[class*="policy"]',
        '[id*="terms"]',
        '[id*="privacy"]',
        '[id*="legal"]',
        '[id*="policy"]'
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
      
      // Clean up the content more thoroughly
      content = content
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
        .replace(/\t/g, ' ')  // Replace tabs with spaces
        .replace(/[^\w\s\.,;:!?()-]/g, '')  // Remove special characters but keep basic punctuation
        .trim();
      
      // Extract metadata and detect document type automatically
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Legal Document';
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      // Auto-detect document type if not specified
      if (documentType === "terms" && content.toLowerCase().includes('privacy')) {
        documentType = "privacy";
      } else if (documentType === "terms" && content.toLowerCase().includes('cookie')) {
        documentType = "cookies";
      } else if (documentType === "terms" && content.toLowerCase().includes('non-disclosure')) {
        documentType = "nda";
      } else if (documentType === "terms" && content.toLowerCase().includes('end user license')) {
        documentType = "eula";
      }
      
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

// Legal Document Analyzer Tool
export const termsAnalyzerTool = tool({
  description: "Analyze legal documents including terms of service, privacy policies, NDAs, contracts, and EULAs to extract key information, data practices, and user rights",
  parameters: z.object({
    content: z.string().describe("The content of the legal document to analyze"),
    documentType: z.enum(["terms", "privacy", "legal", "nda", "contract", "eula", "cookies"]).optional().default("terms").describe("Type of document being analyzed"),
  }),
  execute: async ({ content, documentType }) => {
    try {
      const wordCount = content.trim().split(/\s+/).length;
      
      // Enhanced keywords for different document types
      const dataCollectionKeywords = [
        'personal information', 'personal data', 'personally identifiable information', 'pii',
        'collect', 'gather', 'obtain', 'process', 'store', 'record',
        'email address', 'ip address', 'location data', 'geolocation', 'cookies', 'tracking',
        'analytics', 'usage data', 'device information', 'browsing history', 'search history',
        'payment information', 'credit card', 'financial information', 'billing information',
        'biometric data', 'health information', 'demographic information', 'preferences',
        'social media', 'profile information', 'contact information', 'behavioral data',
        'technical data', 'log files', 'metadata', 'identifiers', 'advertising id'
      ];
      
      const userRightsKeywords = [
        'delete', 'remove', 'access', 'modify', 'correct', 'update', 'rectify',
        'opt-out', 'opt out', 'unsubscribe', 'withdraw consent', 'right to',
        'data protection', 'privacy rights', 'user control', 'request information',
        'portability', 'erasure', 'restriction', 'object', 'automated decision',
        'gdpr', 'ccpa', 'california privacy rights', 'do not sell',
        'data subject rights', 'consent management', 'preference center'
      ];
      
      const sharingKeywords = [
        'third party', 'third-party', 'share', 'disclose', 'transfer', 'sell',
        'partner', 'affiliate', 'vendor', 'service provider', 'subcontractor',
        'advertiser', 'marketing', 'business transfer', 'merger', 'acquisition',
        'government', 'law enforcement', 'legal process', 'court order',
        'public disclosure', 'joint venture', 'subsidiary', 'parent company',
        'data processor', 'data controller', 'international transfer'
      ];
      
      const securityKeywords = [
        'security', 'encrypt', 'encryption', 'secure', 'protect', 'safeguard',
        'ssl', 'tls', 'https', 'data breach', 'unauthorized access', 'vulnerability',
        'firewall', 'authentication', 'authorization', 'access control',
        'incident response', 'security measures', 'data integrity', 'confidentiality',
        'cybersecurity', 'malware', 'phishing', 'fraud prevention',
        'backup', 'disaster recovery', 'penetration testing', 'audit'
      ];
      
      // Additional keywords for specific document types
      const contractKeywords = [
        'agreement', 'contract', 'obligations', 'duties', 'responsibilities',
        'breach', 'default', 'termination', 'renewal', 'payment terms',
        'liability', 'indemnification', 'warranties', 'representations',
        'force majeure', 'governing law', 'jurisdiction', 'dispute resolution'
      ];
      
      const ndaKeywords = [
        'confidential', 'confidentiality', 'non-disclosure', 'proprietary',
        'trade secret', 'disclosure', 'receiving party', 'disclosing party',
        'confidential information', 'proprietary information', 'return',
        'non-compete', 'non-solicitation', 'injunctive relief'
      ];
      
       // Analyze content for different aspects based on document type
       const dataCollection = findRelevantSections(content, dataCollectionKeywords);
       const userRights = findRelevantSections(content, userRightsKeywords);
       const dataSharing = findRelevantSections(content, sharingKeywords);
       const security = findRelevantSections(content, securityKeywords);
       
       // Additional analysis for specific document types
       let contractTerms: string[] = [];
       let confidentialityTerms: string[] = [];
       
       if (documentType === "contract" || documentType === "eula") {
         contractTerms = findRelevantSections(content, contractKeywords);
       }
       
       if (documentType === "nda") {
         confidentialityTerms = findRelevantSections(content, ndaKeywords);
       }
       
       // Generate enhanced summary
       const summary = generateEnhancedSummary(content, documentType);
       
       // Extract key sections with better logic
       const keySections = extractKeySections(content);
       
       // Risk assessment
       const riskFactors = assessRiskFactors(content, documentType);
      
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
          },
          ...(contractTerms.length > 0 && {
            contractTerms: {
              found: contractTerms.length > 0,
              details: contractTerms,
              score: calculateScore(contractTerms, 'contract_terms')
            }
          }),
          ...(confidentialityTerms.length > 0 && {
            confidentialityTerms: {
              found: confidentialityTerms.length > 0,
              details: confidentialityTerms,
              score: calculateScore(confidentialityTerms, 'confidentiality')
            }
          })
        },
        riskFactors,
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

// Legal Document Scorer Tool
export const privacyPolicyScorerTool = tool({
  description: "Assign a comprehensive score to legal documents based on user-friendliness, transparency, data protection practices, and legal clarity",
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
      }),
      contractTerms: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      }).optional(),
      confidentialityTerms: z.object({
        found: z.boolean(),
        details: z.array(z.string()),
        score: z.number()
      }).optional()
    }).describe("Analysis results from the legal document analyzer"),
    documentType: z.enum(["terms", "privacy", "legal", "nda", "contract", "eula", "cookies"]).optional().default("privacy").describe("Type of document being scored"),
    riskFactors: z.array(z.string()).optional().describe("Risk factors identified in the document"),
  }),
  execute: async ({ analysisResults, documentType, riskFactors = [] }) => {
    try {
      const { dataCollection, userRights, dataSharing, security, contractTerms, confidentialityTerms } = analysisResults;
      
      // Calculate overall score (0-100) with different weights based on document type
      let overallScore = 0;
      let maxScore = 100;
      
      // Scoring weights vary by document type
      const weights = getScoreWeights(documentType);
      
      // Data Collection Score
      const dataCollectionScore = dataCollection.found ? 
        Math.min(weights.dataCollection, Math.max(5, dataCollection.score * weights.dataCollection / 10)) : 
        (documentType === "privacy" ? 5 : weights.dataCollection / 2);
      
      // User Rights Score
      const userRightsScore = userRights.found ? 
        Math.min(weights.userRights, Math.max(5, userRights.score * weights.userRights / 10)) : 
        (documentType === "privacy" ? 5 : weights.userRights / 2);
      
      // Data Sharing Score (inverted - lower sharing = higher score)
      const dataSharingScore = dataSharing.found ? 
        Math.max(5, weights.dataSharing - (dataSharing.score * weights.dataSharing / 15)) : 
        weights.dataSharing * 0.8;
      
      // Security Score
      const securityScore = security.found ? 
        Math.min(weights.security, Math.max(5, security.score * weights.security / 10)) : 
        weights.security / 2;
      
      // Additional scores for specific document types
      let contractScore = 0;
      let confidentialityScore = 0;
      
      if (contractTerms && documentType === "contract") {
        contractScore = contractTerms.found ? 
          Math.min(15, Math.max(5, contractTerms.score * 1.5)) : 8;
      }
      
      if (confidentialityTerms && documentType === "nda") {
        confidentialityScore = confidentialityTerms.found ? 
          Math.min(20, Math.max(5, confidentialityTerms.score * 2)) : 10;
      }
      
      // Risk factor penalty
      const riskPenalty = Math.min(15, riskFactors.length * 3);
      
      overallScore = Math.round(
        dataCollectionScore + userRightsScore + dataSharingScore + securityScore + 
        contractScore + confidentialityScore - riskPenalty
      );
      
      // Ensure score is within bounds
      overallScore = Math.max(0, Math.min(100, overallScore));
      
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
      
      // Generate enhanced recommendations
      const recommendations = generateRecommendations(
        analysisResults, 
        documentType, 
        riskFactors, 
        overallScore
      );
      
      return {
        success: true,
        documentType,
        overallScore,
        rating,
        color,
        breakdown: {
          dataCollection: {
            score: Math.round(dataCollectionScore),
            maxScore: weights.dataCollection,
            description: "Transparency in data collection practices"
          },
          userRights: {
            score: Math.round(userRightsScore),
            maxScore: weights.userRights,
            description: "User control and rights protection"
          },
          dataSharing: {
            score: Math.round(dataSharingScore),
            maxScore: weights.dataSharing,
            description: "Third-party data sharing practices"
          },
          security: {
            score: Math.round(securityScore),
            maxScore: weights.security,
            description: "Security measures and protection"
          },
          ...(contractScore > 0 && {
            contractTerms: {
              score: Math.round(contractScore),
              maxScore: 15,
              description: "Contract terms and obligations"
            }
          }),
          ...(confidentialityScore > 0 && {
            confidentialityTerms: {
              score: Math.round(confidentialityScore),
              maxScore: 20,
              description: "Confidentiality and non-disclosure terms"
            }
          })
        },
        riskFactors: riskFactors,
        riskPenalty: riskPenalty,
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

// Direct Text Analyzer Tool
export const directTextAnalyzerTool = tool({
  description: "Analyze legal document text that has been pasted directly (not from a URL)",
  parameters: z.object({
    content: z.string().describe("The legal document text to analyze"),
    documentType: z.enum(["terms", "privacy", "legal", "nda", "contract", "eula", "cookies"]).optional().default("terms").describe("Type of document being analyzed"),
  }),
  execute: async ({ content, documentType }) => {
    try {
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // Auto-detect document type based on content
      const lowerContent = content.toLowerCase();
      if (documentType === "terms") {
        if (lowerContent.includes('privacy policy') || lowerContent.includes('personal data') || lowerContent.includes('data collection')) {
          documentType = "privacy";
        } else if (lowerContent.includes('cookie') && lowerContent.includes('tracking')) {
          documentType = "cookies";
        } else if (lowerContent.includes('non-disclosure') || lowerContent.includes('confidential')) {
          documentType = "nda";
        } else if (lowerContent.includes('end user license') || lowerContent.includes('software license')) {
          documentType = "eula";
        } else if (lowerContent.includes('contract') || lowerContent.includes('agreement')) {
          documentType = "contract";
        }
      }
      
      // Truncate very long content to prevent token limits
      if (wordCount > 3000) {
        const sentences = content.split(/[.!?]+/);
        const truncated = sentences.slice(0, Math.floor(sentences.length * 0.7)).join('. ') + '.';
        content = truncated;
      }
      
      return {
        success: true,
        title: `Pasted ${documentType} Document`,
        documentType,
        content,
        wordCount,
        readingTimeMinutes: Math.ceil(wordCount / 200),
        message: `Successfully processed pasted ${documentType} document (${wordCount} words)`
      };
    } catch (error) {
      console.error("Direct text analysis error:", error);
      
      return {
        success: false,
        documentType,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to process pasted document`
      };
    }
  },
});

// Enhanced helper functions
function findRelevantSections(content: string, keywords: string[]): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const relevant: { sentence: string; score: number }[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (lowerSentence.includes(keywordLower)) {
        // Give higher score for exact matches and important terms
        score += keywordLower.length > 5 ? 2 : 1;
        // Bonus for multiple occurrences
        const occurrences = (lowerSentence.match(new RegExp(keywordLower, 'g')) || []).length;
        score += (occurrences - 1) * 0.5;
      }
    }
    
    if (score > 0) {
      relevant.push({ sentence: sentence.trim(), score });
    }
  }
  
  // Sort by score and return top matches
  return relevant
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.sentence);
}

function generateEnhancedSummary(content: string, documentType: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  
  // Look for key introductory sentences
  const keyPhrases = [
    'this policy', 'this agreement', 'these terms', 'this document',
    'we collect', 'we use', 'we share', 'we protect', 'your privacy',
    'your data', 'your information', 'you agree', 'by using'
  ];
  
  const importantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return keyPhrases.some(phrase => lowerSentence.includes(phrase));
  });
  
  const summarySentences = importantSentences.length > 0 ? 
    importantSentences.slice(0, 3) : 
    sentences.slice(0, 3);
  
  return summarySentences.join('. ') + '.';
}

function extractKeySections(content: string): string[] {
  const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 100);
  
  // Prioritize sections with important headings
  const prioritySections = sections.filter(section => {
    const lowerSection = section.toLowerCase();
    return ['data collection', 'privacy', 'security', 'rights', 'sharing', 'cookies', 'confidential'].some(
      keyword => lowerSection.includes(keyword)
    );
  });
  
  return prioritySections.length > 0 ? prioritySections.slice(0, 5) : sections.slice(0, 5);
}

function calculateScore(details: string[], category: string): number {
  if (details.length === 0) return 0;
  
  const baseScore = Math.min(details.length * 1.5, 10);
  
  // Adjust based on category and content quality
  switch (category) {
    case 'data_collection':
      return Math.min(baseScore * 0.8, 8); // Cap lower for data collection
    case 'user_rights':
      return Math.min(baseScore * 1.2, 10); // Boost user rights
    case 'data_sharing':
      return Math.max(baseScore, 3); // Ensure minimum score for sharing
    case 'security':
      return Math.min(baseScore * 1.1, 10); // Slight boost for security
    case 'contract_terms':
      return Math.min(baseScore, 10);
    case 'confidentiality':
      return Math.min(baseScore * 1.1, 10);
    default:
      return baseScore;
  }
}

function getScoreWeights(documentType: string): {
  dataCollection: number;
  userRights: number;
  dataSharing: number;
  security: number;
} {
  switch (documentType) {
    case "privacy":
      return {
        dataCollection: 25,
        userRights: 35,
        dataSharing: 25,
        security: 15
      };
    case "terms":
      return {
        dataCollection: 20,
        userRights: 30,
        dataSharing: 30,
        security: 20
      };
    case "nda":
      return {
        dataCollection: 15,
        userRights: 20,
        dataSharing: 35,
        security: 30
      };
    case "contract":
      return {
        dataCollection: 10,
        userRights: 25,
        dataSharing: 30,
        security: 35
      };
    case "eula":
      return {
        dataCollection: 20,
        userRights: 25,
        dataSharing: 25,
        security: 30
      };
    case "cookies":
      return {
        dataCollection: 35,
        userRights: 30,
        dataSharing: 25,
        security: 10
      };
    default:
      return {
        dataCollection: 25,
        userRights: 30,
        dataSharing: 25,
        security: 20
      };
  }
}

function assessRiskFactors(content: string, documentType: string): string[] {
  const riskFactors: string[] = [];
  const lowerContent = content.toLowerCase();
  
  // High-risk terms
  const highRiskTerms = [
    'sell your data',
    'share with partners',
    'no guarantee',
    'no warranty',
    'unlimited liability',
    'may terminate at any time',
    'without notice',
    'change terms without notice',
    'third party cookies',
    'track across websites',
    'facial recognition',
    'location tracking',
    'microphone access',
    'camera access',
    'contact list access'
  ];
  
  // Medium-risk terms
  const mediumRiskTerms = [
    'advertising partners',
    'marketing purposes',
    'business purposes',
    'legal compliance',
    'merger or acquisition',
    'government request',
    'law enforcement',
    'automated decision making',
    'profiling',
    'international transfer'
  ];
  
  // Check for high-risk factors
  for (const term of highRiskTerms) {
    if (lowerContent.includes(term)) {
      riskFactors.push(`High Risk: ${term}`);
    }
  }
  
  // Check for medium-risk factors
  for (const term of mediumRiskTerms) {
    if (lowerContent.includes(term)) {
      riskFactors.push(`Medium Risk: ${term}`);
    }
  }
  
  // Document-specific risk factors
  if (documentType === "privacy") {
    if (lowerContent.includes('cookie') && !lowerContent.includes('opt out')) {
      riskFactors.push('Medium Risk: Cookies without opt-out option');
    }
    if (!lowerContent.includes('delete') && !lowerContent.includes('remove')) {
      riskFactors.push('High Risk: No data deletion rights mentioned');
    }
  }
  
  if (documentType === "terms") {
    if (lowerContent.includes('terminate') && !lowerContent.includes('refund')) {
      riskFactors.push('Medium Risk: Termination without refund policy');
    }
  }
  
  if (documentType === "nda") {
    if (lowerContent.includes('perpetual') || lowerContent.includes('indefinite')) {
      riskFactors.push('High Risk: Perpetual or indefinite confidentiality period');
    }
  }
  
  return riskFactors;
}

function generateRecommendations(
  analysisResults: any,
  documentType: string,
  riskFactors: string[],
  overallScore: number
): string[] {
  const recommendations: string[] = [];
  const { dataCollection, userRights, dataSharing, security } = analysisResults;
  
  // Score-based recommendations
  if (dataCollection.score < 7) {
    recommendations.push("Improve transparency about what data is collected and how it's used");
  }
  
  if (userRights.score < 7) {
    recommendations.push("Clearly outline user rights and provide easy ways to exercise them");
  }
  
  if (dataSharing.score > 5) {
    recommendations.push("Reduce third-party data sharing or improve disclosure about partners");
  }
  
  if (security.score < 7) {
    recommendations.push("Strengthen security measures and provide more details about data protection");
  }
  
  // Risk-based recommendations
  if (riskFactors.length > 0) {
    recommendations.push("Review and address identified risk factors");
  }
  
  // Document-specific recommendations
  if (documentType === "privacy") {
    if (overallScore < 60) {
      recommendations.push("Consider implementing stronger privacy controls to comply with GDPR/CCPA");
    }
    if (!dataCollection.found) {
      recommendations.push("Provide clear information about data collection practices");
    }
  }
  
  if (documentType === "terms") {
    if (overallScore < 50) {
      recommendations.push("Make terms more user-friendly and transparent");
    }
    if (!userRights.found) {
      recommendations.push("Include clear information about user rights and dispute resolution");
    }
  }
  
  if (documentType === "nda") {
    if (overallScore < 70) {
      recommendations.push("Consider more balanced confidentiality terms");
    }
    recommendations.push("Ensure confidentiality scope is clearly defined and reasonable");
  }
  
  // General recommendations based on overall score
  if (overallScore < 40) {
    recommendations.push("Major improvements needed for user protection and transparency");
  } else if (overallScore < 60) {
    recommendations.push("Several areas need improvement for better user protection");
  } else if (overallScore < 80) {
    recommendations.push("Good foundation with room for improvement in key areas");
  }
  
  return recommendations.slice(0, 6); // Limit to 6 recommendations
}
