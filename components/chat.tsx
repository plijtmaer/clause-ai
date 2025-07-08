"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Card from "@/components/ui/card"
import Badge from "@/components/ui/badge"
import type { Message } from "@/types/chat"
import { Send, User, Bot, ExternalLink, CheckCircle, XCircle, Loader2, Shield, FileText, BarChart3 } from "lucide-react"

interface ChatProps {
  onSendMessage: (message: string) => void
  messages: Message[]
  isLoading: boolean
  mode: string
}

export default function Chat({ onSendMessage, messages, isLoading, mode }: ChatProps) {
  const [input, setInput] = useState("")
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput("")
    }
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "urlContentFetcher":
        return <FileText className="w-4 h-4" />
      case "termsAnalyzer":
        return <Shield className="w-4 h-4" />
      case "privacyPolicyScorer":
        return <BarChart3 className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
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
          <h4 className="font-semibold text-white">Privacy Score</h4>
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

        {score.recommendations && score.recommendations.length > 0 && (
          <div>
            <h5 className="font-medium text-white mb-2">Recommendations:</h5>
            <ul className="text-sm text-white/70 space-y-1">
              {score.recommendations.slice(0, 3).map((rec: string, idx: number) => (
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

  return messages.length === 0 && !isLoading ? (
    <div className="h-32 max-h-32 overflow-hidden flex items-center justify-center text-white/70 text-sm border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm">
      Ready to analyze — paste a URL to begin.
    </div>
  ) : (
    <div className="flex flex-col h-full max-h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">

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
                    <span className="text-white/70 capitalize">{tool.toolName.replace(/([A-Z])/g, " $1").trim()}</span>
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a privacy policy or terms of service URL..."
            disabled={isLoading}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 px-6 rounded-md flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
