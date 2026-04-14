"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { newSession, sendChatMessage } from "@/lib/api";

interface Message {
  role: "user" | "bot";
  content: string;
}

type ChatSize = "default" | "large" | "fullscreen";

const SIZES: Record<ChatSize, string> = {
  default: "w-80 md:w-96 h-[500px]",
  large: "w-[480px] h-[650px]",
  fullscreen: "w-[95vw] md:w-[600px] h-[85vh]",
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [chatSize, setChatSize] = useState<ChatSize>("default");
  const bottomRef = useRef<HTMLDivElement>(null);

  const initSession = useCallback(async () => {
    let storedSid = sessionStorage.getItem("nexloan_chat_session");
    if (!storedSid) {
      try {
        const res = await newSession();
        storedSid = res.session_id;
        sessionStorage.setItem("nexloan_chat_session", storedSid as string);
      } catch (err) {
        console.error("Failed to start chat session", err);
        return;
      }
    }
    setSessionId(storedSid);
    setMessages([
      { role: "bot", content: "Hi there! I'm NexBot, your NexLoan assistant. How can I help you today?" }
    ]);
  }, []);

  // Initialize Session
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Auto scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isAuthenticating]);

  const handleRefresh = async () => {
    // Clear session and start fresh
    sessionStorage.removeItem("nexloan_chat_session");
    setSessionId(null);
    setMessages([]);
    setIsAuthenticating(false);
    setIsTyping(false);
    setInput("");

    try {
      const res = await newSession();
      sessionStorage.setItem("nexloan_chat_session", res.session_id);
      setSessionId(res.session_id);
      setMessages([
        { role: "bot", content: "Session refreshed! How can I help you today?" }
      ]);
    } catch (err) {
      console.error("Failed to refresh session", err);
      setMessages([
        { role: "bot", content: "Failed to refresh session. Please try again." }
      ]);
    }
  };

  const cycleSize = () => {
    const order: ChatSize[] = ["default", "large", "fullscreen"];
    const currentIdx = order.indexOf(chatSize);
    setChatSize(order[(currentIdx + 1) % order.length]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userText = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setIsTyping(true);

    try {
      const res = await sendChatMessage(sessionId, userText);
      setIsTyping(false);
      
      if (res.action === "REQUEST_LOGIN") {
        setIsAuthenticating(true);
      } else {
        setIsAuthenticating(false);
      }
      
      setMessages(prev => [...prev, { role: "bot", content: res.reply }]);
      
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I had trouble connecting to the server. Let's try that again." }]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50 active:scale-95 shadow-indigo-500/20"
      >
        {isOpen ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          <span className="text-2xl leading-none">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 ${SIZES[chatSize]} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-out`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700 p-4 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm shadow-inner">🤖</div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">NexBot AI</h3>
              <p className="text-[10px] uppercase tracking-widest text-indigo-100/70 font-bold">Online • Powered by Groq</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Resize Button */}
              <button
                onClick={cycleSize}
                title={chatSize === "default" ? "Enlarge" : chatSize === "large" ? "Fullscreen" : "Minimize"}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-xs"
              >
                {chatSize === "default" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                  </svg>
                )}
              </button>
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                title="Refresh Chat"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.182-3.182" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900 flex flex-col gap-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm transition-all animate-in fade-in slide-in-from-bottom-1 ${
                  msg.role === "user" 
                    ? "bg-indigo-600 dark:bg-blue-600 text-white self-end rounded-tr-none shadow-md shadow-indigo-500/10" 
                    : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 self-start shadow-sm rounded-tl-none whitespace-pre-wrap leading-relaxed"
                }`}
              >
                {msg.content}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 self-start rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            
            {/* Identity Verification Warning */}
            {isAuthenticating && !isTyping && (
              <div className="self-center flex flex-col items-center my-4 text-center bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/20">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <span className="animate-pulse">🔐</span> IDENTITY VERIFICATION REQUIRED
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">Please provide the identification requested above.</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 border-transparent transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 dark:hover:bg-blue-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-[1px]">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
