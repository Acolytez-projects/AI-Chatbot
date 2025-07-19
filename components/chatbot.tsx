'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export default function Chat() {
  const [isTyping, setIsTyping] = useState(false)
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    reload
  } = useChat({
    api: '/api/chat',
    onResponse(response) {
      if (!response.ok) {
        console.error('Chat API error:', response.status, response.statusText)
      }
    },
    onFinish() {
      setIsTyping(false)
    },
    onError(error) {
      console.error('Chat error:', error)
      setIsTyping(false)
    }
  })

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      setIsTyping(true)
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">AI Chatbot</h1>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 border rounded-lg bg-gray-50">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center">
            Start a conversation by typing a message below.
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
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium mb-1">AI</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>Error: {error.message}</span>
            <button
              onClick={() => reload()}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {isLoading && (
          <button
            type="button"
            onClick={stop}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Stop
          </button>
        )}
      </form>
    </div>
  )
}