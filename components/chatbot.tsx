// 'use client' directive tells Next.js this component runs on the client-side
// This is required for components that use React hooks like useState, useEffect
// Without this, the component would try to run on the server and fail
'use client'

// Import the useChat hook from Vercel AI SDK
// This hook provides all the functionality needed for a chat interface:
// - Managing message state, handling user input, API communication, streaming responses
import { useChat } from 'ai/react'

// Import useState for managing component-level state
// We use this to track when the AI is "typing" (generating a response)
import { useState } from 'react'

// Main Chat component - default export means it can be imported without braces
// This is the entire chat interface that users will interact with
export default function Chat() {
  // Local state to track if AI is currently generating a response
  // This allows us to show a typing indicator for better UX
  // useState returns [currentValue, setterFunction]
  const [isTyping, setIsTyping] = useState(false)
  
  // useChat hook manages all chat functionality
  // It handles message history, API calls, streaming, and user input
  const {
    // Array of all messages in the conversation
    // Each message has: id, role ('user'|'assistant'), content, createdAt
    messages,
    
    // Current value of the input field
    // Automatically managed by the hook - no need for separate useState
    input,
    
    // Function to handle input field changes
    // Updates the 'input' value when user types
    handleInputChange,
    
    // Function to handle form submission
    // Sends the message to API and manages the response
    handleSubmit,
    
    // Boolean indicating if a request is currently in progress
    // Used to disable input/buttons and show loading states
    isLoading,
    
    // Function to stop/cancel an ongoing AI response
    // Useful if the response is taking too long or user wants to interrupt
    stop,
    
    // Error object if something goes wrong with the API call
    // Contains error message and other details for debugging
    error,
    
    // Function to retry the last request
    // Useful when there's an error and user wants to try again
    reload
  } = useChat({
    // Specify the API endpoint for chat requests
    // This should match your API route file location
    api: '/api/chat',
    
    // Callback function that runs when we receive a response from the API
    // Allows us to handle HTTP errors before they reach the user
    onResponse(response) {
      // Check if the HTTP response was successful (status 200-299)
      if (!response.ok) {
        // Log error details for debugging
        // response.status = HTTP status code (404, 500, etc.)
        // response.statusText = Human-readable status description
        console.error('Chat API error:', response.status, response.statusText)
      }
    },
    
    // Callback function that runs when the AI finishes generating a response
    // Perfect place to cleanup UI states like typing indicators
    onFinish() {
      setIsTyping(false)  // Hide typing indicator when response is complete
    },
    
    // Callback function that runs if an error occurs during the chat process
    // Handles both network errors and API errors
    onError(error) {
      console.error('Chat error:', error)  // Log for debugging
      setIsTyping(false)  // Hide typing indicator on error
    }
  })

  // Custom submit handler that adds validation and typing indicator
  // We create our own instead of using handleSubmit directly to add extra logic
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()  // Prevent default form submission (page reload)
    
    // Only submit if input has actual content (not just whitespace)
    // trim() removes leading/trailing spaces
    if (input.trim()) {
      setIsTyping(true)    // Show typing indicator immediately
      handleSubmit(e)      // Call the actual submit handler from useChat
    }
  }

  // Main component render - defines the entire chat interface UI
  return (
    // Main container: full height, centered, with padding
    // Flexbox column layout stacks elements vertically
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* App title - centered and bold */}
      <h1 className="text-2xl font-bold mb-4 text-center">AI Chatbot</h1>
      
      {/* Messages container - scrollable area that takes remaining space */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 border rounded-lg bg-gray-50">
        {/* Show welcome message when no messages exist yet */}
        {messages.length === 0 && (
          <div className="text-gray-500 text-center">
            Start a conversation by typing a message below.
          </div>
        )}
        
        {/* Render each message in the conversation */}
        {messages.map((message) => (
          <div
            key={message.id}  // Unique key required by React for list items
            className={`flex ${
              // Align user messages to the right, AI messages to the left
              // Creates a typical chat interface layout
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Individual message bubble */}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                // Different styling for user vs AI messages
                // User: blue background with white text
                // AI: white background with border
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Message sender label */}
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              {/* Message content with preserved whitespace and line breaks */}
              {/* whitespace-pre-wrap preserves spaces and line breaks from the text */}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator shown when AI is generating a response */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium mb-1">AI</div>
              {/* Animated dots to show AI is "thinking" */}
              <div className="flex space-x-1">
                {/* Three bouncing dots with staggered animation delays */}
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error display section - only shows when there's an error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            {/* Error message */}
            <span>Error: {error.message}</span>
            {/* Retry button - calls reload() to retry the last request */}
            <button
              onClick={() => reload()}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Input form section - where users type and send messages */}
      <form onSubmit={onSubmit} className="flex gap-2">
        {/* Text input field */}
        <input
          type="text"
          value={input}              // Controlled by useChat hook
          onChange={handleInputChange}  // Updates input state on change
          className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={isLoading}      // Disable input while request is in progress
        />
        
        {/* Send button */}
        <button
          type="submit"
          // Disable if loading or if input is empty (after trimming whitespace)
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {/* Dynamic button text based on loading state */}
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        
        {/* Stop button - only show when a request is in progress */}
        {isLoading && (
          <button
            type="button"  // type="button" prevents form submission
            onClick={stop}  // Calls stop() function to cancel the request
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Stop
          </button>
        )}
      </form>
    </div>
  )
}