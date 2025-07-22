// Import the streamText function from Vercel AI SDK
// This function handles streaming responses from AI models in real-time
// Instead of waiting for the complete response, it streams tokens as they're generated
import { streamText } from "ai";

// Import createOpenAI to create an OpenAI-compatible client
// We use this instead of the regular OpenAI client because it allows us to customize
// the baseURL to point to OpenRouter instead of OpenAI's servers
import { createOpenAI } from "@ai-sdk/openai";

// Import NextRequest type for proper TypeScript typing of the incoming request
// This ensures we get proper intellisense and type checking
import { NextRequest } from "next/server";

// Set runtime to 'edge' for better performance and lower latency
// Edge runtime is faster than Node.js runtime for simple API operations
// It runs closer to users geographically, reducing response time
export const runtime = "edge";

// Create OpenAI client configured specifically for OpenRouter
// OpenRouter acts as a proxy/gateway that provides access to multiple AI models
// through a single API endpoint, including models from OpenAI, Anthropic, etc.
const openai = createOpenAI({
  // Point to OpenRouter's API endpoint instead of OpenAI's direct endpoint
  // This allows us to access multiple AI providers through one interface
  baseURL: "https://openrouter.ai/api/v1",

  // Use OpenRouter API key from environment variables for security
  // Never hardcode API keys in source code - always use environment variables
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Main POST handler function that processes incoming chat requests
// This function runs when someone sends a POST request to /api/chat
export async function POST(req: NextRequest) {
  try {
    // Extract the messages array from the request body
    // Messages contain the conversation history: user messages and AI responses
    // Each message has a role ('user', 'assistant', 'system') and content
    const { messages } = await req.json();

    // Validate that messages exist and are in the correct format
    // This prevents errors if the frontend sends malformed data
    // Without this check, the AI API call would fail with unclear errors
    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // Security check: ensure API key is configured
    // Without an API key, OpenRouter will reject our requests
    // Better to fail fast with a clear error than let it fail at the API level
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response("Missing OPENROUTER_API_KEY", { status: 500 });
    }

    // Make the actual AI API call using streamText
    // streamText enables real-time response streaming instead of waiting for complete response
    const result = await streamText({
      // Specify the AI model to use in OpenRouter's format: provider/model
      // 'openai/gpt-3.5-turbo' tells OpenRouter to use OpenAI's GPT-3.5-turbo model
      // Different from direct OpenAI API which just uses 'gpt-3.5-turbo'
      model: openai("openai/gpt-3.5-turbo"),

      // Pass the conversation messages to the AI model
      // The model uses this history to generate contextually appropriate responses
      messages,

      // OpenRouter-specific headers for tracking and compliance
      headers: {
        // HTTP-Referer header identifies your application to OpenRouter
        // Required by OpenRouter for usage tracking and potential rate limiting
        // Uses environment variable or defaults to localhost for development
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",

        // Optional title for better tracking in OpenRouter dashboard
        // Helps identify your application in usage statistics
        "X-Title": "My-Chatbot",
      },

      // AI model parameters to control response behavior
      // Temperature controls randomness: 0.7 is balanced (not too random, not too deterministic)
      // Lower values (0.1-0.3) = more focused, higher values (0.8-1.0) = more creative
      temperature: 0.7,

      // Maximum number of tokens (words/characters) in the response
      // Prevents excessively long responses that could be expensive or slow
      // 1000 tokens ≈ 750 words, good for chat responses
      maxTokens: 1000,
    });

    // Convert the streaming result to a proper HTTP response
    // toDataStreamResponse() creates a streaming HTTP response that the frontend can consume
    // This enables real-time text streaming in the chat interface
    return result.toDataStreamResponse();
  } catch (error: unknown) {
    // Log the full error for debugging purposes
    // Console.error helps developers diagnose issues during development

    const err = error as { status?: number; message?: string };

    console.error("OpenRouter API Error:", err);

    // Handle specific error types with appropriate HTTP status codes
    // This provides better user experience and debugging information

    // 401 Unauthorized: Invalid or missing API key
    // Happens when OPENROUTER_API_KEY is wrong or expired
    if (err.status === 401) {
      return new Response("Invalid API key", { status: 401 });
    }
    // 429 Too Many Requests: Rate limit exceeded
    // Happens when you've made too many requests in a short time period
    else if (err.status === 429) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
    // 400 Bad Request: Malformed request data
    // Happens when the request format is incorrect
    else if (err.status === 400) {
      return new Response("Bad request", { status: 400 });
    }

    // Generic error handler for any other issues
    // Returns 500 status code indicating server error
    // Uses err.message if available, otherwise shows generic error
    return new Response(`Error: ${err.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
