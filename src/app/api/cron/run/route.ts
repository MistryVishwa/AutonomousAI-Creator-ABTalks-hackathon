import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Configure to run every X minutes/hours via Vercel Cron
// Set max duration if needed: export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // 1. Fetch all active agents
    const agents = await prisma.agent.findMany();
    if (agents.length === 0) {
      return NextResponse.json({ message: 'No active agents found' });
    }

    const results = [];

    // Process each agent
    for (const agent of agents) {
      // 2. Memory: Fetch recent posts to avoid repetition
      const recentPosts = await prisma.post.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { text: true, sources: true }
      });
      
      const memoryContext = recentPosts.length > 0 
        ? recentPosts.map(p => `- ${p.text}`).join('\n')
        : "No previous posts.";

      // 3. Topic Discovery (Mocked here, use Tavily/Exa in production)
      // Since we don't have user's Tavily key, we will simulate the search for the hackathon
      // A robust implementation would do: fetch(`https://api.tavily.com/search`, { ... })
      const simulatedTopics = [
        `New breakthrough in ${agent.domain} models showing 50% efficiency gain.`,
        `Controversy over open-source vs closed-source ${agent.domain} tools.`,
        `Major company announces integration of ${agent.domain} into their flagship product.`
      ];

      // 4. Editorial Judgment & Generation
      const prompt = `
        You are an autonomous AI creator with the following persona:
        Name: ${agent.name}
        Domain: ${agent.domain}

        Your task is to review recent news topics and decide if one is worth publishing about.
        If none meet your standard, reject them. If one does, write a high-quality post about it.
        
        Recent news topics discovered:
        ${simulatedTopics.join('\n')}

        Memory (Your recent posts, DO NOT repeat these topics):
        ${memoryContext}

        Return a JSON object with:
        - isWorthy: boolean (true if you found a good topic, false if rejected)
        - text: The actual content of the post (if worthy)
        - rationale: Why you selected this, why it's relevant now, and why it was chosen over others.
        - sources: Array of strings (URLs or sources of information used).
      `;

      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          isWorthy: z.boolean(),
          text: z.string().optional(),
          rationale: z.string().optional(),
          sources: z.array(z.string()).optional(),
        }),
        prompt,
      });

      // 5. Autonomous Publishing
      if (object.isWorthy && object.text) {
        const post = await prisma.post.create({
          data: {
            agentId: agent.id,
            text: object.text,
            rationale: object.rationale || "Topic was deemed highly relevant.",
            sources: JSON.stringify(object.sources || []),
          },
        });
        results.push({ agentId: agent.id, status: 'published', postId: post.id });
      } else {
        results.push({ agentId: agent.id, status: 'rejected' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
