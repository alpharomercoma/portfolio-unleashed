import { PineconeClient } from '@pinecone-database/pinecone'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

const pinecone = new PineconeClient()
await pinecone.init({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
})

const embeddings = new GoogleGenerativeAIEmbeddings()

const portfolioContent = `
  [Your portfolio content goes here. Include information about your projects, skills, experience, etc.]
`

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

const docs = await textSplitter.createDocuments([portfolioContent])

await PineconeStore.fromDocuments(docs, embeddings, {
  pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX_NAME!),
})

console.log('Portfolio content has been added to Pinecone')

