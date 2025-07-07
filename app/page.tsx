"use client";

import { useState } from "react";
import Chat from "@/components/chat";
import { Message } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      content,
      sources: [],
      toolResults: [],
      response: "",
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          mode: "terms", // Changed from "wikipedia" to "terms"
        }),
      });

      const data = await response.json();

      // Update the last message with the response
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        lastMessage.response = data.response;
        lastMessage.sources = data.sources || [];
        lastMessage.toolResults = data.toolResults || [];
        return updated;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Update with error message
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        lastMessage.response = "Sorry, I encountered an error while processing your request. Please try again.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col max-h-screen">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Terms & Privacy Analyzer
          </h1>
          <p className="text-sm text-gray-600">
            Analyze terms of service and privacy policies to understand what you're agreeing to
          </p>
        </div>

        {/* Features Row */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-100 text-center">
            <div className="text-purple-600 text-lg">📄</div>
            <p className="text-xs text-gray-600 font-medium">Document Analysis</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-100 text-center">
            <div className="text-purple-600 text-lg">🔒</div>
            <p className="text-xs text-gray-600 font-medium">Privacy Scoring</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-100 text-center">
            <div className="text-purple-600 text-lg">💡</div>
            <p className="text-xs text-gray-600 font-medium">Smart Insights</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-100 text-center">
            <div className="text-purple-600 text-lg">📊</div>
            <p className="text-xs text-gray-600 font-medium">Data Collection</p>
          </div>
        </div>

        {/* Chat Interface - Takes remaining space */}
        <div className="flex-1 max-w-4xl mx-auto w-full min-h-0">
          <Chat 
            onSendMessage={handleSendMessage}
            messages={messages}
            isLoading={isLoading}
            mode="terms"
          />
        </div>
      </div>
    </div>
  );
}
