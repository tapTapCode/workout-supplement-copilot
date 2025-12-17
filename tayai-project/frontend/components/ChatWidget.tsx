'use client'

import React, { useState, useRef, useEffect } from 'react'
import { api, ChatRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usageStatus, setUsageStatus] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadChatHistory()
      loadUsageStatus()
    }
  }, [isAuthenticated])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory(50)
      const formattedMessages: Message[] = history.map((msg: any) => ({
        id: `msg-${msg.id}`,
        role: 'user',
        content: msg.message,
        timestamp: new Date(msg.created_at),
      }))
      // Add responses
      history.forEach((msg: any, index: number) => {
        if (msg.response) {
          formattedMessages.splice(index * 2 + 1, 0, {
            id: `response-${msg.id}`,
            role: 'assistant',
            content: msg.response,
            timestamp: new Date(msg.created_at),
          })
        }
      })
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const loadUsageStatus = async () => {
    try {
      const status = await api.getUsageStatus()
      setUsageStatus(status)
    } catch (error) {
      console.error('Failed to load usage status:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !isAuthenticated) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const request: ChatRequest = {
        message: userMessage.content,
        conversation_history: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }

      const response = await api.sendMessage(request)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      loadUsageStatus() // Refresh usage status
    } catch (error: any) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.response?.data?.detail || 'Failed to send message. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">Please log in to use TayAI</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">TayAI Assistant</h2>
        {usageStatus && (
          <div className="text-sm">
            {usageStatus.messages_used} / {usageStatus.messages_limit} messages
            {!usageStatus.can_send && (
              <span className="ml-2 text-yellow-300">(Limit reached)</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with TayAI!</p>
            <p className="text-sm mt-2">
              Ask about hair education or business mentorship.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            disabled={loading || (usageStatus && !usageStatus.can_send)}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || (usageStatus && !usageStatus.can_send)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        {usageStatus && !usageStatus.can_send && (
          <p className="text-sm text-red-600 mt-2">
            Usage limit reached. Please upgrade your membership.
          </p>
        )}
      </div>
    </div>
  )
}
