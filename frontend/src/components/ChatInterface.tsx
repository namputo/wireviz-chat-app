'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ChatInterfaceProps {
  onYamlGenerated?: (yaml: string) => void
  currentYaml?: string
}

export default function ChatInterface({ onYamlGenerated, currentYaml }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋 Hello! I\'m your AI wiring assistant. I can help you create and modify WireViz diagrams using natural language. Just describe what you need!',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: inputValue,
          current_yaml: currentYaml 
        }),
      })

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response?.content || 'Sorry, I encountered an error.',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

      // Extract and pass YAML if generated
      if (data.response?.yaml_generated && onYamlGenerated) {
        onYamlGenerated(data.response.yaml_generated)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Error connecting to server. Please check if the backend is running.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Developer-friendly Header */}
      <div className="bg-gray-700 text-white p-4 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono">AI Assistant</h2>
            <p className="text-gray-300 text-xs font-medium">
              {currentYaml ? 'Context-aware editing' : 'Ready to help'}
            </p>
          </div>
        </div>
        {currentYaml && (
          <div className="mt-3 bg-gray-600/50 rounded-md p-2 border border-gray-600">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="text-gray-200 font-medium">Context mode: modifying existing YAML</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Messages - Fixed Height Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-gray-800 min-h-0"
      >
        <div className="p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%]`}>
                {!message.isUser && (
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200 border border-gray-600'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap font-mono">{message.content}</p>
                  <p className={`text-xs mt-2 opacity-70 ${message.isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.isUser && (
                  <div className="w-6 h-6 bg-gray-600 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    U
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-300 font-mono">Processing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Fixed Input Area */}
      <div className="flex-shrink-0 p-4 bg-gray-700 border-t border-gray-600">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={currentYaml ? "Modify wiring..." : "Ask AI to create wiring..."}
              className="w-full p-3 pr-10 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono text-gray-200 bg-gray-800 placeholder-gray-500"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Send size={16} />
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="mt-2 flex flex-wrap gap-1">
          {!currentYaml ? (
            <>
              <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-300 transition-colors font-mono">
                USB cable
              </button>
              <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-300 transition-colors font-mono">
                Power harness
              </button>
            </>
          ) : (
            <>
              <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-300 transition-colors font-mono">
                Add connector
              </button>
              <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-300 transition-colors font-mono">
                Modify pins
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}