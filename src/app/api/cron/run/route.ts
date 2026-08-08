import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import Parser from 'rss-parser';

export async function GET(request: Request) {
  try {
    const agents = await prisma.agent.findMany();
    if (agents.length === 0) {
      return NextResponse.json({ message: 'No active agents found' });
    }

    const results = [];
    const parser = new Parser();

    for (const agent of agents) {
      // 1. Topic Discovery (Live Information Source - 100% Free & Dynamic)
      let liveTopics: { title: string, contentSnippet: string, link: string }[] = [];
      try {
        const query = encodeURIComponent(agent.domain);
        const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`);
        liveTopics = feed.items.slice(0, 5).map(item => ({
          title: item.title || '',
          contentSnippet: item.contentSnippet || '',
          link: item.link || ''
        }));
      } catch (e) {
        console.error(`RSS fetch failed for domain ${agent.domain}`, e);
      }

      if (liveTopics.length === 0) {
        results.push({ agentId: agent.id, status: 'skipped (no news)' });
        continue;
      }

      const topicsText = liveTopics.map(t => `Title: ${t.title}\nSummary: ${t.contentSnippet}\nLink: ${t.link}`).join('\n\n');
      // 2. Memory
      const recentPosts = await prisma.post.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { text: true, sources: true }
      });
      
      const memoryContext = recentPosts.length > 0 
        ? recentPosts.map(p => `- ${p.text}`).join('\n')
        : "No previous posts.";

      // 3. Editorial Judgment & Generation (Free Gemini AI)
      const prompt = `
        You are an autonomous AI creator with the following persona:
        Name: ${agent.name}
        Domain: ${agent.domain}

        Your task is to review recent live news topics and decide if one is worth publishing about.
        If none meet your standard, reject them (isWorthy: false). If one does, write a high-quality post about it.
        
        Recent live news discovered:
        ${topicsText}

        Memory (Your recent posts, DO NOT repeat these topics):
        ${memoryContext}

        Return a JSON object with:
        - isWorthy: boolean (true if you found a good topic, false if rejected)
        - text: The actual content of the post (if worthy)
        - rationale: Why you selected this, why it's relevant now, and why it was chosen over others.
        - sources: Array of strings (URLs or sources of information used).
      `;

      // Use gemini-1.5-flash for speed and free tier limits
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: z.object({
          isWorthy: z.boolean(),
          text: z.string().optional(),
          rationale: z.string().optional(),
          sources: z.array(z.string()).optional(),
        }),
        prompt,
      });

      // 4. Autonomous Publishing
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
