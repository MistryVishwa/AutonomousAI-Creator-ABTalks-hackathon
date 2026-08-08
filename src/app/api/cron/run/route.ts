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

      const topicsText = liveTopics.map((t, i) => `[Topic ${i+1}]\nTitle: ${t.title}\nSummary: ${t.contentSnippet}\nLink: ${t.link}`).join('\n\n');
      
      // 2. Memory
      const recentPosts = await prisma.post.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { text: true, sources: true }
      });
      
      const memoryContext = recentPosts.length > 0 
        ? recentPosts.map(p => `- ${p.text.slice(0, 150)}...`).join('\n')
        : "No previous posts. This is your first post.";

      // 3. Editorial Judgment & Generation (Strict Criteria)
      const prompt = `
        You are an autonomous AI creator with the following expert persona:
        - Name: ${agent.name}
        - Domain of Expertise: ${agent.domain}

        Your task is to review 5 recent live news topics discovered from the web and apply strict EDITORIAL JUDGMENT. 
        You must decide if ANY of these topics are worth publishing about to your highly technical audience.

        *** EDITORIAL STANDARDS ***
        1. REJECT generic news, fluff pieces, or overly broad topics.
        2. REJECT topics you have already posted about recently.
        3. ACCEPT only if the topic is highly relevant to "${agent.domain}", represents a meaningful shift/update in the industry, and allows you to form a distinct, expert opinion.
        4. If you accept a topic, write a LinkedIn/X style post (2-3 short paragraphs) in a highly professional, expert voice. Do NOT use hashtags. DO NOT just summarize the article—add your own expert commentary, insights, or predictions based on your persona.

        Recent live news discovered:
        ${topicsText}

        Memory (Your recent posts, DO NOT repeat these topics):
        ${memoryContext}

        Return a JSON object with:
        - isWorthy: boolean (true ONLY if a topic meets the strict standards, false if all are rejected)
        - text: The actual content of the post (if worthy). Must include expert commentary.
        - rationale: A 1-2 sentence explanation of WHY you selected this specific topic over the others, WHY it is relevant now, and HOW it fits your editorial standards. (If rejected, explain why all topics failed your standards).
        - sources: Array of strings (URLs or sources of information used).
      `;

      // Use gemini-1.5-flash for speed and free tier limits
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: z.object({
          isWorthy: z.boolean(),
          text: z.string().optional(),
          rationale: z.string(),
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
            rationale: object.rationale,
            sources: JSON.stringify(object.sources || []),
          },
        });
        results.push({ agentId: agent.id, status: 'published', postId: post.id });
      } else {
        // We simulate "rejection" in the results to prove editorial judgment
        results.push({ agentId: agent.id, status: 'rejected', rationale: object.rationale });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
