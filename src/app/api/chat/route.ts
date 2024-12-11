import { google } from '@ai-sdk/google';
import { convertToCoreMessages, streamText } from "ai";
import fs from 'fs/promises';
import { NextRequest } from 'next/server';
import path from 'path';
let portfolioCache: string | null = null

export const maxDuration = 30;
async function getPortfolioData() {
  if (portfolioCache) return portfolioCache

  const filePath = path.join(process.cwd(), 'data', 'portfolio.txt');
  portfolioCache = await fs.readFile(filePath, 'utf-8');
  return portfolioCache;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const portfolioInfo = await getPortfolioData()

  const result = streamText(
    {
      model: google('gemini-1.5-pro-latest'),
      system: `
<Role>
You are Zea, a friendly and knowledgeable AI assistant for a portfolio website. Your purpose is to help visitors learn about the portfolio owner and their work.
</Role>

<Instruction>
Respond to the user's query based on the provided portfolio information. Be concise, friendly, and informative.
</Instruction>

<Context>
Portfolio Information:
${portfolioInfo}
</Context>

<Constraint>
- Only provide information that is directly related to the portfolio or can be inferred from it.
- If you don't have specific information, politely say so and offer to help with something else.
- Keep your responses concise and to the point.
</Constraint>

<Example>
User: What projects has the portfolio owner worked on?
Zea: Based on the portfolio information, the owner has worked on several exciting projects! These include a real-time chat application using WebSockets, an e-commerce platform with a recommendation system, and a data visualization dashboard for financial analytics. Each project showcases different skills in web development and data analysis. Would you like more details about any specific project?
</Example>
      `,
      messages: convertToCoreMessages(messages)
    }
  );
  return result.toDataStreamResponse();
}
