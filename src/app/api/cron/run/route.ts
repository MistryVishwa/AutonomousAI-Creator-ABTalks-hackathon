import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import Parser from 'rss-parser';

// Allow this serverless function to run for up to 60 seconds to prevent 504 Gateway Timeout on Vercel
export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Google has been staging out model access unpredictably for newer API keys
// mid-project (2.5-flash got locked out for "new users" after 1.5-flash was
// fully deprecated). To keep the agent alive through the 48h judging window
// without babysitting it, try a small ordered list of models and fall back
// automatically instead of hard-failing on one restricted model.
const MODEL_FALLBACK_CHAIN = [
  { provider: 'groq', model: 'llama-3.3-70b-versatile' }, // Groq is 10x faster and finishes within Vercel's 10s limit
  { provider: 'groq', model: 'llama-3.1-8b-instant' },
  { provider: 'google', model: 'gemini-3.5-flash' },
  { provider: 'google', model: 'gemini-2.0-flash' },
  { provider: 'google', model: 'gemini-flash-latest' }
];

async function generateObjectWithFallback(args: { system: string; prompt: string; schema: any }) {
  const attempts: { model: string; error: string }[] = [];
  for (const modelDef of MODEL_FALLBACK_CHAIN) {
    try {
      const model = modelDef.provider === 'google' ? google(modelDef.model) : groq(modelDef.model);
      // Hard-cap each individual model attempt at 12s. With up to 5 models in
      // the chain that's a worst case of ~60s total, but in practice the
      // first (Groq) attempt succeeds almost every time and this just stops
      // a single hung call from silently burning the whole request budget.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      try {
        const result = await generateObject({ ...args, model, abortSignal: controller.signal });
        return { object: result.object, modelUsed: modelDef.model, attempts };
      } finally {
        clearTimeout(timeout);
      }
    } catch (err: any) {
      // Always keep trying the rest of the chain, no matter why this one
      // failed - a bad Gemini call should never block the Groq fallbacks
      // that come after it, and vice versa.
      const errorMsg = err?.message || String(err);
      attempts.push({ model: `${modelDef.provider}/${modelDef.model}`, error: errorMsg });
      console.warn(`Model ${modelDef.provider}/${modelDef.model} failed: ${errorMsg}`);
    }
  }
  // Every model in the chain failed - throw an error that actually shows
  // what happened with each one, instead of a generic message.
  const summary = attempts.map(a => `[${a.model}] ${a.error}`).join(' | ');
  throw new Error(`All models in fallback chain failed: ${summary}`);
}

export async function GET(request: Request) {
  try {
    // Fail fast and loud if keys are missing/misconfigured, rather than
    // discovering it 5 failed model attempts later. The most common cause:
    // an env var added in Vercel but only for Preview/Development, or added
    // without triggering a redeploy (Vercel only picks up new env vars on
    // the NEXT deployment, not automatically).
    const missingKeys: string[] = [];
    if (!process.env.GROQ_API_KEY) missingKeys.push('GROQ_API_KEY');
    if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) missingKeys.push('GOOGLE_API_KEY');
    if (missingKeys.length > 0) {
      console.warn(`Missing env vars at runtime: ${missingKeys.join(', ')}`);
    }

    const allAgents = await prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
    if (allAgents.length === 0) {
      return NextResponse.json({ message: 'No active agents found' });
    }

    // Only process the most recently created agents per tick. Old test/demo
    // agents from local development shouldn't silently pile up and eat the
    // 60s Vercel budget on every future cron run.
    const agents = allAgents.slice(0, 3);

    const parser = new Parser();

    async function processAgent(agent: (typeof agents)[number]) {
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
        return { agentId: agent.id, status: 'skipped (no news)' };
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
        ? recentPosts.map((p: { text: string }) => `- ${p.text.slice(0, 150)}...`).join('\n')
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

        Memory (Your recent posts, DO NOT repeat these topics):
        ${memoryContext}
        
        Recent live news discovered:
        ${topicsText}`;

      let object: any;
      let modelUsed = "unknown";

      try {
        const result = await generateObjectWithFallback({
          system: `You are an expert ${agent.domain} persona named ${agent.name}. Analyze the provided live news topics and apply strict editorial judgment.`,
          prompt,
          schema: z.object({
            isWorthy: z.boolean(),
            text: z.string().nullable().describe("String representing your expert post (if worthy), or null"),
            rationale: z.string().describe("String explaining why you accepted or rejected it"),
            sources: z.array(z.string()).describe("Only include the EXACT link URL provided in the Recent live news section. Do NOT hallucinate or guess any other URLs.")
          })
        });
        object = result.object;
        modelUsed = result.modelUsed;
      } catch (err: any) {
        console.error('Failed to generate object:', err);
        return { agentId: agent.id, status: 'error', rationale: err?.message || 'AI failed to generate response' };
      }

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
        return { agentId: agent.id, status: 'published', postId: post.id, modelUsed };
      } else {
        // Save rejected topic to DB to prove Editorial Judgment
        await prisma.rejectedTopic.create({
          data: {
            agentId: agent.id,
            title: liveTopics[0].title, // Use the first topic as representative for simplicity
            link: liveTopics[0].link,
            rationale: object.rationale || 'Did not meet editorial standards',
          }
        });
        return { agentId: agent.id, status: 'rejected', rationale: object.rationale };
      }
    }

    // Run agents concurrently instead of one-by-one - wall-clock time becomes
    // roughly "slowest single agent" instead of "sum of every agent", which
    // is what was blowing past the 60s Vercel limit with multiple agents.
    const settled = await Promise.allSettled(agents.map(processAgent));
    const results = settled.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { agentId: agents[i].id, status: 'error', rationale: String(r.reason) }
    );

    return NextResponse.json({ success: true, results, ...(missingKeys.length > 0 ? { warning: `Missing env vars: ${missingKeys.join(', ')}` } : {}) });
  } catch (error: any) {
    console.error('Cron error:', error);
    
    // Diagnostic: If it's a model error, fetch the allowed models to see what their key actually supports!
    if (error.message && error.message.includes('not found for API version v1beta')) {
      try {
        const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        const availableModels = data.models ? data.models.map((m: any) => m.name).join(', ') : 'None found/API Disabled';
        return NextResponse.json({ 
          error: `API Key Error: ${error.message}. Your key only supports these models: ${availableModels}. Please ensure you used Google AI Studio, not Google Cloud Console.` 
        }, { status: 500 });
      } catch (diagError) {
        // Fallback if diagnostic fails
      }
    }

    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}