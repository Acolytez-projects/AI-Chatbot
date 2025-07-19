import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Create OpenAI client configured for OpenRouter
const openai = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Validate that we have messages
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 })
    }

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('Missing OPENROUTER_API_KEY', { status: 500 })
    }

    const result = await streamText({
      model: openai('openai/gpt-3.5-turbo'), // OpenRouter format: provider/model
      messages,
      // OpenRouter-specific headers can be passed here
      headers: {
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'My-Chatbot',
      },
      // Optional: Add temperature, max tokens, etc.
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (err: any) {
    console.error('OpenRouter API Error:', err)
    
    // More detailed error handling
    if (err.status === 401) {
      return new Response('Invalid API key', { status: 401 })
    } else if (err.status === 429) {
      return new Response('Rate limit exceeded', { status: 429 })
    } else if (err.status === 400) {
      return new Response('Bad request', { status: 400 })
    }
    
    return new Response(`Error: ${err.message || 'Unknown error'}`, { status: 500 })
  }
}