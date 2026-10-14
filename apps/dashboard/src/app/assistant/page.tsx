"use client";

import React, { useState, useRef, useEffect } from "react";
import { submitAssistantQuery } from "../../lib/api";
import { ChatMessage } from "../../types";
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Send, Sparkles, User, Bot, MessageSquareCode } from "lucide-react";
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
      {/* Messages */}
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
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === "user"
                    ? "bg-primary border-primary text-on-primary"
                    : "bg-canvas border-hairline text-ink"
                }`}>
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[85%] md:max-w-[75%]`}>
                  <div className={`rounded-lg p-4 text-body-md leading-relaxed border ${
                    msg.sender === "user"
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-canvas text-body border-hairline"
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {msg.richData && (
                      <div className="mt-4 pt-4 border-t border-hairline text-body">
                        <span className="text-caption text-muted uppercase tracking-wider block mb-3">
                          {msg.richData.title || "Reference Data"}
                        </span>

                        {msg.richData.type === "chart" && msg.richData.chartData && (
                          <div className="h-44 w-full bg-surface-soft p-3 rounded-md border border-hairline">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={msg.richData.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#181d26" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {msg.richData.type === "table" && msg.richData.tableData && (
                          <div className="border border-hairline rounded-md overflow-hidden bg-canvas text-body-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(msg.richData.tableData[0] || {}).map((k) => (
                                    <TableHead key={k} className="px-3 py-2 text-caption uppercase">{k}</TableHead>
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
                          <div className="p-4 bg-surface-soft rounded-md border border-hairline text-body-md leading-relaxed">
                            {msg.richData.reportHtml ? (
                              <div dangerouslySetInnerHTML={{ __html: msg.richData.reportHtml }}
                                className="prose prose-zinc max-w-none text-body" />
                            ) : msg.richData.tableData && (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="px-2 py-1 text-caption">Rank</TableHead>
                                    <TableHead className="px-2 py-1 text-caption">Project</TableHead>
                                    <TableHead className="px-2 py-1 text-caption">Score</TableHead>
                                    <TableHead className="px-2 py-1 text-caption">Cost</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {msg.richData.tableData.map((p: any, pIdx) => (
                                    <TableRow key={pIdx}>
                                      <TableCell className="px-2 py-1 font-medium">{p.Rank}</TableCell>
                                      <TableCell className="px-2 py-1">{p.Project}</TableCell>
                                      <TableCell className="px-2 py-1 font-medium text-primary">{p.Score}</TableCell>
                                      <TableCell className="px-2 py-1 font-medium">{p.Cost}</TableCell>
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
                  <span className="text-body-md text-muted px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-4 items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border bg-canvas text-ink">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-canvas border border-hairline rounded-lg px-5 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-canvas border-t border-hairline px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-caption text-muted uppercase mr-1">Suggestions:</span>
            <button onClick={() => handleQuickPrompt("What are the top issues this quarter?")}
              className="text-body-md bg-surface-soft hover:bg-zinc-200 text-ink rounded-sm px-3 py-1.5 border border-hairline cursor-pointer transition-colors">
              Top Issues?
            </button>
            <button onClick={() => handleQuickPrompt("Show water-related complaints near Siyani")}
              className="text-body-md bg-surface-soft hover:bg-zinc-200 text-ink rounded-sm px-3 py-1.5 border border-hairline cursor-pointer transition-colors">
              Water in Siyani?
            </button>
            <button onClick={() => handleQuickPrompt("Why is the road repair project ranked #1?")}
              className="text-body-md bg-surface-soft hover:bg-zinc-200 text-ink rounded-sm px-3 py-1.5 border border-hairline cursor-pointer transition-colors">
              Why Ranked #1?
            </button>
            <button onClick={() => handleQuickPrompt("Generate a monthly development report.")}
              className="text-body-md bg-surface-soft hover:bg-zinc-200 text-ink rounded-sm px-3 py-1.5 border border-hairline cursor-pointer transition-colors">
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
