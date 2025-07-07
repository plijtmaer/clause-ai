"use client";

import { useState } from "react";
import { Message } from "@/types/chat";
import SourcesDisplay from "./sources-display";
import ToolResultsDisplay from "./tool-results-display";

interface ChatProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isLoading: boolean;
  mode: "terms" | "web";
}

export default function Chat({ onSendMessage, messages, isLoading, mode }: ChatProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const getWelcomeContent = () => {
    if (mode === "terms") {
      return {
        title: "Terms & Privacy Analyzer",
        description: "I can analyze terms of service and privacy policies to help you understand what you're agreeing to. Just provide a URL to any terms or privacy policy document.",
        examples: [
          "Analyze the privacy policy at https://example.com/privacy",
          "What does this terms of service say about data collection: https://example.com/terms",
          "Score this privacy policy and tell me what data they collect: https://example.com/privacy-policy"
        ]
      };
    } else {
      return {
        title: "Web Research Assistant", 
        description: "I can search the web, find the best sources, scrape content, and provide current information summaries.",
        examples: [
          "Search for the latest news about electric vehicles and summarize",
          "Find current information about climate change policies"
        ]
      };
    }
  };

  const welcomeContent = getWelcomeContent();

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <h3 className="text-lg font-medium mb-2">{welcomeContent.title}</h3>
            <p className="text-sm mb-4">
              {welcomeContent.description}
            </p>
            <div className="bg-purple-50 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-purple-800 mb-2">Try these examples:</p>
              <div className="text-xs text-purple-700 space-y-1">
                {welcomeContent.examples.map((example, index) => (
                  <div key={index} className="cursor-pointer hover:text-purple-900 hover:underline" 
                       onClick={() => setInput(example)}>
                    "{example}"
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-purple-600 text-white rounded-lg px-4 py-2">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <SourcesDisplay sources={message.sources} />
              )}

              {/* Tool Results */}
              {message.toolResults && message.toolResults.length > 0 && (
                <ToolResultsDisplay results={message.toolResults} />
              )}

              {/* Assistant Response */}
              {message.response && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 rounded-lg px-4 py-3">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message.response}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm text-gray-600">
                  {mode === "terms" ? "Analyzing terms & privacy policy..." : "Researching the web..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "terms" ? "Paste a URL to terms of service or privacy policy to analyze..." : "Ask me to research anything on the web..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
