import type { ToolResult } from "@/types/chat";
import React from "react";

interface ToolResultsDisplayProps {
  results: ToolResult[];
}

export default function ToolResultsDisplay({ results }: ToolResultsDisplayProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-900">
              {getToolIcon(result.toolName)} {getToolDisplayName(result.toolName)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              result.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {result.success ? 'Success' : 'Error'}
            </span>
          </div>
          
          {result.success ? (
            <div className="text-sm">
              {formatToolResult(result.toolName, result.result)}
            </div>
          ) : (
            <div className="text-sm text-red-700">
              Error: {result.error || 'Unknown error'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getToolIcon(toolName: string): string {
  const icons: { [key: string]: string } = {
    urlContentFetcher: "🔍",
    termsAnalyzer: "📊",
    privacyPolicyScorer: "⭐",
    internetSearch: "🌐",
    localFileSearch: "📁",
    createTextFile: "📄",
    editTextFile: "✏️",
  };
  return icons[toolName] || "🔧";
}

function getToolDisplayName(toolName: string): string {
  const displayNames: { [key: string]: string } = {
    urlContentFetcher: "Document Fetcher",
    termsAnalyzer: "Terms Analyzer",
    privacyPolicyScorer: "Privacy Scorer",
    internetSearch: "Internet Search",
    localFileSearch: "File Search",
    createTextFile: "Create File",
    editTextFile: "Edit File",
  };
  return displayNames[toolName] || toolName;
}

function formatToolResult(toolName: string, result: any): React.ReactElement {
  if (result.error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
        ❌ {result.error}
      </div>
    );
  }

  switch (toolName) {
    case 'urlContentFetcher':
      return (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-700 font-medium">📄 Document Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <div className="text-gray-600">{result.title}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <div className="text-gray-600 capitalize">{result.documentType} Document</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Word Count:</span>
                <div className="text-gray-600">{result.wordCount?.toLocaleString()} words</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Reading Time:</span>
                <div className="text-gray-600">{result.readingTimeMinutes} minutes</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'termsAnalyzer':
      return (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-700 font-medium">📊 Analysis Results</span>
            </div>
            
            {/* Summary */}
            {result.summary && (
              <div className="mb-4 p-3 bg-white rounded border">
                <div className="font-medium text-gray-700 mb-2">Summary:</div>
                <div className="text-gray-600 text-sm">{result.summary}</div>
              </div>
            )}

            {/* Analysis Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.analysis && Object.entries(result.analysis).map(([category, data]: [string, any]) => (
                <div key={category} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      data.found ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {data.found ? 'Found' : 'Not Found'}
                    </span>
                  </div>
                  
                  {data.found && data.details && data.details.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Key Points:</div>
                      {data.details.slice(0, 2).map((detail: string, idx: number) => (
                        <div key={idx} className="mb-1 pl-2 border-l-2 border-gray-200">
                          {detail.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Score:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(data.score / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{data.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'privacyPolicyScorer':
      return (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-indigo-700 font-medium">⭐ Privacy Score</span>
            </div>
            
            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      fill="none"
                      strokeWidth="3"
                      stroke="currentColor"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`text-${result.color}-500`}
                      fill="none"
                      strokeWidth="3"
                      stroke="currentColor"
                      strokeDasharray={`${result.overallScore}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{result.overallScore}</div>
                      <div className="text-xs text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`text-lg font-semibold mt-2 text-${result.color}-700`}>
                {result.rating}
              </div>
            </div>

            {/* Score Breakdown */}
            {result.breakdown && (
              <div className="space-y-3 mb-4">
                <div className="font-medium text-gray-700 mb-2">Score Breakdown:</div>
                {Object.entries(result.breakdown).map(([category, data]: [string, any]) => (
                  <div key={category} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {data.description}
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.score}/{data.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(data.score / data.maxScore) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round((data.score / data.maxScore) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white rounded-lg p-3 border">
                <div className="font-medium text-gray-700 mb-2">💡 Recommendations:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {result.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );

    case 'internetSearch':
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{result.message}</div>
          {result.results && result.results.length > 0 && (
            <div className="space-y-1">
              {result.results.slice(0, 3).map((searchResult: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-2 rounded border">
                  <div className="font-medium text-blue-600 text-sm">
                    {searchResult.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {searchResult.snippet?.substring(0, 150)}
                    {searchResult.snippet?.length > 150 ? '...' : ''}
                  </div>
                  {searchResult.url && (
                    <div className="text-xs text-blue-500 mt-1">
                      {searchResult.url}
                    </div>
                  )}
                </div>
              ))}
              {result.results.length > 3 && (
                <div className="text-xs text-gray-500">
                  ...and {result.results.length - 3} more results
                </div>
              )}
            </div>
          )}
        </div>
      );
      
    default:
      return (
        <div className="bg-gray-50 p-3 rounded border">
          <div className="text-sm text-gray-600">{result.message || 'Operation completed'}</div>
        </div>
      );
  }
} 