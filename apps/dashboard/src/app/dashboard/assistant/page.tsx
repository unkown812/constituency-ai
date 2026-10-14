"use client";

import React, { useState, useRef, useEffect } from "react";
import { submitAssistantQuery } from "../../../lib/api";
import { ChatMessage } from "../../../types";
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card } from "../../../components/ui";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial_1",
      sender: "assistant",
      text: "Namaste MP Rajesh Vaghela! I am your JanSahayak AI Assistant. Ask me anything about constituency feedback, project prioritisations, or infrastructure gaps.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const queryText = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await submitAssistantQuery(queryText);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: "I encountered an error looking up that record. Please try another query.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-3.5rem)] flex flex-col -mx-4 md:-mx-6 lg:-mx-8 -mt-6 md:-mt-8">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-brand text-white"
                    : "bg-surface text-text border border-border"
                }`}>
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[85%] md:max-w-[75%]`}>
                  <div className={`px-4 py-3 text-body leading-relaxed border ${
                    msg.sender === "user"
                      ? "bg-brand text-white border-brand/20"
                      : "bg-canvas text-text border-border"
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {msg.richData && (
                      <div className="mt-4 pt-4 border-t border-border text-body text-secondary">
                        <span className="text-mono-label text-muted block mb-3">
                          {msg.richData.title || "Reference Data"}
                        </span>

                        {msg.richData.type === "chart" && msg.richData.chartData && (
                          <div className="h-44 w-full bg-surface p-3 border border-border">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={msg.richData.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#93939f" />
                                <YAxis tick={{ fontSize: 9 }} stroke="#93939f" />
                                <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #d9d9dd", fontSize: 12 }} />
                                <Bar dataKey="value" fill="#17171c" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {msg.richData.type === "table" && msg.richData.tableData && (
                          <div className="border border-border bg-canvas text-body">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(msg.richData.tableData[0] || {}).map((k) => (
                                    <TableHead key={k} className="px-3 py-2">{k}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {msg.richData.tableData.map((row, rIdx) => (
                                  <TableRow key={rIdx}>
                                    {Object.values(row).map((val: any, cIdx) => (
                                      <TableCell key={cIdx} className="px-3 py-2">{val}</TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {msg.richData.type === "report" && (
                          <div className="p-4 bg-surface border border-border text-body leading-relaxed">
                            {msg.richData.reportHtml ? (
                              <div dangerouslySetInnerHTML={{ __html: msg.richData.reportHtml }}
                                className="prose prose-zinc max-w-none text-body" />
                            ) : msg.richData.tableData && (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="px-2 py-1">Rank</TableHead>
                                    <TableHead className="px-2 py-1">Project</TableHead>
                                    <TableHead className="px-2 py-1">Score</TableHead>
                                    <TableHead className="px-2 py-1">Cost</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {msg.richData.tableData.map((p: any, pIdx) => (
                                    <TableRow key={pIdx}>
                                      <TableCell className="px-2 py-1 font-medium text-text">{p.Rank}</TableCell>
                                      <TableCell className="px-2 py-1">{p.Project}</TableCell>
                                      <TableCell className="px-2 py-1 font-medium text-blue">{p.Score}</TableCell>
                                      <TableCell className="px-2 py-1 font-medium text-text">{p.Cost}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-caption text-muted px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 items-center"
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-surface text-text border border-border">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-canvas border border-border px-5 py-3 flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand/30 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-canvas border-t border-border px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            <Sparkles className="w-3.5 h-3.5 text-blue shrink-0" />
            <button onClick={() => handleQuickPrompt("What are the top issues this quarter?")}
              className="text-caption bg-surface hover:bg-surface-alt text-text px-3 py-1.5 border border-border cursor-pointer transition-colors">
              Top Issues?
            </button>
            <button onClick={() => handleQuickPrompt("Show water-related complaints near Siyani")}
              className="text-caption bg-surface hover:bg-surface-alt text-text px-3 py-1.5 border border-border cursor-pointer transition-colors">
              Water in Siyani?
            </button>
            <button onClick={() => handleQuickPrompt("Why is the road repair project ranked #1?")}
              className="text-caption bg-surface hover:bg-surface-alt text-text px-3 py-1.5 border border-border cursor-pointer transition-colors">
              Why Ranked #1?
            </button>
            <button onClick={() => handleQuickPrompt("Generate a monthly development report.")}
              className="text-caption bg-surface hover:bg-surface-alt text-text px-3 py-1.5 border border-border cursor-pointer transition-colors">
              Monthly Report
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input type="text"
              placeholder="Ask your query..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
              disabled={isTyping} />
            <Button type="submit" variant="primary" disabled={isTyping} className="gap-2 shrink-0">
              <Send className="w-4 h-4" /> Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
