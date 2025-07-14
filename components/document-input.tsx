"use client"

import { useState } from "react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { Send, Link, Type, Loader2 } from "lucide-react"

interface DocumentInputProps {
  onSubmit: (content: string, mode: "url" | "text") => void
  isLoading: boolean
  onModeChange?: (mode: "url" | "text") => void
}

export default function DocumentInput({ onSubmit, isLoading, onModeChange }: DocumentInputProps) {
  const [input, setInput] = useState("")
  const [inputMode, setInputMode] = useState<"url" | "text">("url")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && validateInput()) {
      onSubmit(input.trim(), inputMode)
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

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setInputMode("url")
            setInput("")
            onModeChange?.("url")
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
            onModeChange?.("text")
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
      </div>

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

      {/* Helper text */}
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
    </div>
  )
}
