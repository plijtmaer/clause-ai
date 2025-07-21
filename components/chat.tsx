"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Card from "@/components/ui/card"
import Badge from "@/components/ui/badge"
import type { Message } from "@/types/chat"
import { Send, User, Bot, ExternalLink, CheckCircle, XCircle, Loader2, Shield, FileText, BarChart3, Link, Type, Upload } from "lucide-react"
import ProgressStatus from "@/components/progress-status"
import DocumentUpload from "@/components/document-upload"

interface ChatProps {
  onSendMessage: (message: string) => void
  messages: Message[]
  isLoading: boolean
  mode: string
}

export default function Chat({ onSendMessage, messages, isLoading, mode }: ChatProps) {
  const [input, setInput] = useState("")
  const [inputMode, setInputMode] = useState<"url" | "text" | "file">("url")
  const [progress, setProgress] = useState<{ step: number; total: number; message: string; status: 'pending' | 'in_progress' | 'completed' | 'error' } | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<{
    docId: string
    fileName: string
    chunksCreated: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      scrollToBottom()
    }
    prevMessageCount.current = messages.length
  }, [messages])

  // Update progress when loading starts
  useEffect(() => {
    if (isLoading && !progress) {
      setProgress({ step: 1, total: 4, message: "Starting analysis...", status: 'in_progress' })
    } else if (!isLoading && progress) {
      setProgress(null)
    }
  }, [isLoading, progress])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput("")
    }
  }

  const validateInput = () => {
    if (inputMode === "url") {
      const url = input.trim()
      try {
        new URL(url)
        return url.startsWith("http://") || url.startsWith("https://")
      } catch {
        return false
      }
    } else {
      const text = input.trim()
      return text.length > 20 && text.split(' ').length > 3 // Minimum meaningful text
    }
  }

  const handleUploadSuccess = (result: {
    docId: string
    fileName: string
    fileType: string
    textLength: number
    chunksCreated: number
    chunksInserted: number
  }) => {
    setUploadedDocument({
      docId: result.docId,
      fileName: result.fileName,
      chunksCreated: result.chunksCreated
    })
    
    // Trigger analysis of uploaded document
    onSendMessage(`Analyze uploaded document: ${result.fileName} (${result.chunksCreated} chunks processed)`)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // Error is already handled by the DocumentUpload component
  }

  const getValidationMessage = () => {
    if (!input.trim()) return null
    
    if (inputMode === "url") {
      const url = input.trim()
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "⚠️ Please enter a valid URL starting with http:// or https://"
      }
      try {
        new URL(url)
        return "✅ Valid URL"
      } catch {
        return "⚠️ Please enter a valid URL"
      }
    } else {
      const text = input.trim()
      if (text.length < 20) {
        return "⚠️ Please enter at least 20 characters"
      }
      if (text.split(' ').length < 3) {
        return "⚠️ Please enter meaningful text (at least 3 words)"
      }
      return "✅ Ready to analyze"
    }
  }

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

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4" style={{ minHeight: '500px', maxHeight: '70vh' }}>
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white/70 text-sm">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to analyze</h3>
                <p className="text-white/60">Choose URL, Text, or File mode below to begin analyzing your legal document.</p>
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg">
                  <p className="text-purple-200 text-xs">
                    💾 <strong>Info:</strong> All your documents are automatically stored for future reference in your dashboard!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className="space-y-4">
            {/* User Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 border border-white/20">
                  <p className="text-white">{message.content}</p>
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
                      <p className="text-white whitespace-pre-wrap leading-relaxed">{message.response}</p>
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
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                                      onClick={() => window.open(source.url, "_blank")}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-white/70">Analyzing document...</span>
                </div>
              </div>
            </div>
          </div>
        )}

                 {/* Progress Status */}
         {progress && (
           <ProgressStatus
             progress={progress}
             isVisible={true}
           />
         )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-6 border-t border-white/10 bg-white/5">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setInputMode("url")
              setInput("")
              setUploadedDocument(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === "url"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            <Link className="w-4 h-4" />
            URL
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode("text")
              setInput("")
              setUploadedDocument(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === "text"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode("file")
              setInput("")
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === "file"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            File
          </button>
        </div>

        {inputMode === "file" ? (
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            className="mb-4"
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            {inputMode === "url" ? (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste document URL (e.g., https://example.com/privacy-policy)"
                disabled={isLoading}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20 h-12"
              />
            ) : (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste legal document text here (Privacy Policy, Terms of Service, NDA, Contract, EULA, etc.)"
                disabled={isLoading}
                rows={5}
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20 rounded-md px-3 py-2 resize-none"
              />
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !validateInput()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 px-8 py-3 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed self-end min-w-[80px]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Helper text */}
        {inputMode !== "file" && (
          <div className="mt-3 text-sm text-white/60">
            {getValidationMessage() ? (
              <span className={getValidationMessage()?.startsWith("✅") ? "text-green-400 font-medium" : "text-yellow-400 font-medium"}>
                {getValidationMessage()}
              </span>
            ) : (
              inputMode === "url" ? (
                <span>📄 Paste a URL to fetch and analyze a legal document</span>
              ) : (
                <span>📝 Paste the full text of a legal document to analyze</span>
              )
            )}
          </div>
        )}

        {/* Uploaded Document Info */}
        {uploadedDocument && (
          <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-300 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Document "{uploadedDocument.fileName}" uploaded successfully</span>
            </div>
            <p className="text-green-200/70 text-xs mt-1">
              {uploadedDocument.chunksCreated} chunks processed and ready for analysis
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
