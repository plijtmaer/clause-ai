"use client"

import { useState } from "react"
import Chat from "@/components/chat"
import type { Message } from "@/types/chat"
import { Shield, FileText, Brain, BarChart3, Sparkles, Zap } from "lucide-react"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      content,
      sources: [],
      toolResults: [],
      response: "",
    }

    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          mode: "terms",
        }),
      })

      const data = await response.json()

      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        lastMessage.response = data.response
        lastMessage.sources = data.sources || []
        lastMessage.toolResults = data.toolResults || []
        return updated
      })
    } catch (error) {
      console.error("Error sending message:", error)
      
      let errorMessage = "Sorry, I encountered an error while processing your request. Please try again."
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "⏱️ Request timed out. Please try again with a shorter document or check your internet connection."
        } else if (error.message.includes('fetch')) {
          errorMessage = "🌐 Unable to fetch the document. Please check the URL and try again."
        } else if (error.message.includes('rate limit')) {
          errorMessage = "🚫 Rate limit exceeded. Please wait a moment and try again."
        }
      }

      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        lastMessage.response = errorMessage
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: "Multi-Document Analysis",
      description: "Privacy policies, terms, NDAs, contracts & more",
      color: "from-blue-500 to-cyan-500",
      delay: "0ms",
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Identify high-risk clauses and red flags",
      color: "from-purple-500 to-pink-500",
      delay: "100ms",
    },
    {
      icon: Brain,
      title: "Smart Scoring",
      description: "Weighted scores based on document type",
      color: "from-green-500 to-emerald-500",
      delay: "200ms",
    },
    {
      icon: BarChart3,
      title: "Actionable Insights",
      description: "Clear recommendations and next steps",
      color: "from-orange-500 to-red-500",
      delay: "300ms",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white/90 font-medium">AI-Powered Legal Analysis</span>
              <Zap className="w-5 h-5 text-blue-400" />
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4 leading-tight">
              Clause AI
              <br />
              <span className="text-2xl">Analyzer</span>
            </h1>

            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
              Decode complex legal documents with AI. Analyze privacy policies, terms of service, NDAs, contracts, and
              EULAs to understand risks and protect your rights.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: feature.delay }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-full h-full text-white" />
                </div>

                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-purple-200 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl`}
                ></div>
              </div>
            ))}
          </div>

          {/* Chat Interface */}
          <div className="mt-8">
            <Chat onSendMessage={handleSendMessage} messages={messages} isLoading={isLoading} mode="terms" />
          </div>
        </div>
      </div>
    </div>
  )
}
