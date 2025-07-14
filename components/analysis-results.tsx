"use client"

import { useRef, useEffect } from "react"
import Card from "@/components/ui/card"
import Badge from "@/components/ui/badge"
import type { Message } from "@/types/chat"
import { 
  User, 
  Bot, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Shield, 
  FileText, 
  BarChart3 
} from "lucide-react"

interface AnalysisResultsProps {
  messages: Message[]
}

export default function AnalysisResults({ messages }: AnalysisResultsProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "urlContentFetcher":
        return <FileText className="w-4 h-4" />
      case "directTextAnalyzer":
        return <FileText className="w-4 h-4" />
      case "termsAnalyzer":
        return <Shield className="w-4 h-4" />
      case "privacyPolicyScorer":
        return <BarChart3 className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case "urlContentFetcher":
        return "Document Fetcher"
      case "directTextAnalyzer":
        return "Text Processor"
      case "termsAnalyzer":
        return "Legal Analyzer"
      case "privacyPolicyScorer":
        return "Document Scorer"
      default:
        return toolName.replace(/([A-Z])/g, " $1").trim()
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const renderPrivacyScore = (toolResult: any) => {
    if (toolResult.toolName !== "privacyPolicyScorer" || !toolResult.result?.success) return null

    const score = toolResult.result
    return (
      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h4 className="font-semibold text-white">Document Score</h4>
        </div>

        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>{score.overallScore}/100</div>
          <div className="text-white/60 text-sm">{score.rating}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(score.breakdown || {}).map(([key, value]: [string, any]) => (
            <div key={key} className="text-center">
              <div className={`text-lg font-semibold ${getScoreColor(value.score)}`}>
                {value.score}/{value.maxScore}
              </div>
              <div className="text-xs text-white/60 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
            </div>
          ))}
        </div>

        {/* Risk Factors */}
        {score.riskFactors && score.riskFactors.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Risk Factors ({score.riskFactors.length})
            </h5>
            <div className="space-y-1">
              {score.riskFactors.slice(0, 3).map((risk: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    risk.startsWith('High') ? 'bg-red-500/20 text-red-300' :
                    risk.startsWith('Medium') ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {risk.split(':')[0]}
                  </span>
                  <span className="text-xs text-white/60">{risk.split(':')[1]?.trim()}</span>
                </div>
              ))}
              {score.riskFactors.length > 3 && (
                <div className="text-xs text-white/40 mt-2">
                  +{score.riskFactors.length - 3} more risks identified
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {score.recommendations && score.recommendations.length > 0 && (
          <div>
            <h5 className="font-medium text-white mb-2">Recommendations:</h5>
            <ul className="text-sm text-white/70 space-y-1">
              {score.recommendations.slice(0, 4).map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
        <div className="text-white/60">
          <FileText className="w-12 h-12 mx-auto mb-4 text-white/40" />
          <p className="text-lg font-medium mb-2">No analysis yet</p>
          <p className="text-sm">Submit a document above to see the analysis results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analysis Results
        </h2>
      </div>

      <div className="max-h-[600px] overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="space-y-4">
            {/* User Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 border border-white/20">
                  <p className="text-white text-sm">{message.content}</p>
                </div>
              </div>
            </div>

            {/* Tool Results */}
            {message.toolResults && message.toolResults.length > 0 && (
              <div className="ml-11 space-y-2">
                {message.toolResults.map((tool, toolIndex) => (
                  <div key={toolIndex} className="flex items-center gap-2 text-sm">
                    {getToolIcon(tool.toolName)}
                    <span className="text-white/70">{getToolDisplayName(tool.toolName)}</span>
                    {tool.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Assistant Response */}
            {message.response && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 border border-white/20">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{message.response}</p>
                    </div>

                    {/* Privacy Score Display */}
                    {message.toolResults?.map((tool, idx) => (
                      <div key={idx}>{renderPrivacyScore(tool)}</div>
                    ))}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Sources
                        </h4>
                        <div className="space-y-2">
                          {message.sources.map((source, sourceIndex) => (
                            <Card
                              key={sourceIndex}
                              className="p-3 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h5 className="text-white font-medium text-sm mb-1">{source.title}</h5>
                                  {source.snippet && (
                                    <p className="text-white/60 text-xs leading-relaxed">{source.snippet}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {source.source && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-white/10 text-white/80 border-white/20"
                                    >
                                      {source.source}
                                    </Badge>
                                  )}
                                  {source.url && source.url !== "#analysis" && source.url !== "#score" && (
                                    <button
                                      onClick={() => window.open(source.url, "_blank")}
                                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
