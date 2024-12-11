import { StreamingTextResponse, LangChainStream, Message } from 'ai'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { PineconeClient } from '@pinecone-database/pinecone'
import { VectorDBQAChain } from 'langchain/chains'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

export const runtime = 'edge'

const genAI = new ChatGoogleGenerativeAI({
  modelName: 'gemini-pro',
  apiKey: process.env.GOOGLE_API_KEY!,
  streaming: true,
})

const pinecone = new PineconeClient()

export async function POST(req: Request) {
  const { messages } = await req.json()
  const { stream, handlers } = LangChainStream()

  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  })

  const vectorStore = await PineconeStore.fromExistingIndex(
    new GoogleGenerativeAIEmbeddings(),
    { pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX_NAME!) }
  )

  const chain = VectorDBQAChain.fromLLM(genAI, vectorStore)

  const prompt = `You are Zea, an AI assistant for Alpha's software engineering portfolio. Your role is to provide information about Alpha's projects, skills, and experience. Use the following chat history and the user's question to provide a helpful response. If you don't have specific information, you can provide general advice or ask for clarification.

Chat history:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')}


`

  const response = await chain.call({
    query: messages[messages.length -1].content,
    chat_history: messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')
  })

  const streamResponse = await genAI.call(prompt + response.text)

  return new StreamingTextResponse(streamResponse)
}

