"use client"

import Chat from "@/components/chat";
import { useState } from "react";

export default function VectorizePage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    console.log("Message sent:", content);
  };

  return (
    <Chat 
      onSendMessage={handleSendMessage}
      messages={messages}
      isLoading={isLoading}
      mode="terms"
    />
  );
}
