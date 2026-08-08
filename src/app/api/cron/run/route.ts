// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { generateText } from 'ai';
// import { createGoogleGenerativeAI } from '@ai-sdk/google';
// import { z } from 'zod';
// import Parser from 'rss-parser';

// const google = createGoogleGenerativeAI({
//   apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
// });

// export async function GET(request: Request) {
//   try {
//     const agents = await prisma.agent.findMany();
//     if (agents.length === 0) {
//       return NextResponse.json({ message: 'No active agents found' });
//     }

//     const results = [];
//     const parser = new Parser();

//     for (const agent of agents) {
//       // 1. Topic Discovery (Live Information Source - 100% Free & Dynamic)
//       let liveTopics: { title: string, contentSnippet: string, link: string }[] = [];
//       try {
//         const query = encodeURIComponent(agent.domain);
//         const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`);
//         liveTopics = feed.items.slice(0, 5).map(item => ({
//           title: item.title || '',
//           contentSnippet: item.contentSnippet || '',
//           link: item.link || ''
//         }));
//       } catch (e) {
//         console.error(`RSS fetch failed for domain ${agent.domain}`, e);
//       }

//       if (liveTopics.length === 0) {
//         results.push({ agentId: agent.id, status: 'skipped (no news)' });
//         continue;
//       }

//       const topicsText = liveTopics.map((t, i) => `[Topic ${i+1}]\nTitle: ${t.title}\nSummary: ${t.contentSnippet}\nLink: ${t.link}`).join('\n\n');
      
//       // 2. Memory
//       const recentPosts = await prisma.post.findMany({
//         where: { agentId: agent.id },
//         orderBy: { createdAt: 'desc' },
//         take: 5,
//         select: { text: true, sources: true }
//       });
      
//       const memoryContext = recentPosts.length > 0 
//         ? recentPosts.map(p => `- ${p.text.slice(0, 150)}...`).join('\n')
//         : "No previous posts. This is your first post.";

//       // 3. Editorial Judgment & Generation (Strict Criteria)
//       const prompt = `
//         You are an autonomous AI creator with the following expert persona:
//         - Name: ${agent.name}
//         - Domain of Expertise: ${agent.domain}

//         Your task is to review 5 recent live news topics discovered from the web and apply strict EDITORIAL JUDGMENT. 
//         You must decide if ANY of these topics are worth publishing about to your highly technical audience.

//         *** EDITORIAL STANDARDS ***
//         1. REJECT generic news, fluff pieces, or overly broad topics.
//         2. REJECT topics you have already posted about recently.
//         3. ACCEPT only if the topic is highly relevant to "${agent.domain}", represents a meaningful shift/update in the industry, and allows you to form a distinct, expert opinion.
//         4. If you accept a topic, write a LinkedIn/X style post (2-3 short paragraphs) in a highly professional, expert voice. Do NOT use hashtags. DO NOT just summarize the article—add your own expert commentary, insights, or predictions based on your persona.

//         Memory (Your recent posts, DO NOT repeat these topics):
//         ${memoryContext}
        
//         Recent live news discovered:
//         ${topicsText}`;

//       // Use gemini-3.5-flash as the newest available model for this user
//       const { text } = await generateText({
//         model: google('gemini-3.5-flash'),
//         system: `You are an expert ${agent.domain} persona named ${agent.name}.
//         Analyze the provided live news topics and apply strict editorial judgment.
        
//         You MUST respond with a raw JSON object and nothing else. Do not use markdown code blocks like \`\`\`json.
//         The JSON must match this structure exactly:
//         {
//           "isWorthy": boolean,
//           "text": "String representing your expert post (if worthy), or null",
//           "rationale": "String explaining why you accepted or rejected it",
//           "sources": ["URL string"]
//         }`,
//         prompt,
//       });

//       let object;
//       try {
//         const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
//         object = JSON.parse(cleanText);
//       } catch (parseError) {
//         console.error('Failed to parse Gemini JSON output:', text);
//         results.push({ agentId: agent.id, status: 'error', rationale: 'JSON parse failed' });
//         continue;
//       }

//       // 4. Autonomous Publishing
//       if (object.isWorthy && object.text) {
//         const post = await prisma.post.create({
//           data: {
//             agentId: agent.id,
//             text: object.text,
//             rationale: object.rationale,
//             sources: JSON.stringify(object.sources || []),
//           },
//         });
//         results.push({ agentId: agent.id, status: 'published', postId: post.id });
//       } else {
//         // We simulate "rejection" in the results to prove editorial judgment
//         results.push({ agentId: agent.id, status: 'rejected', rationale: object.rationale });
//       }
//     }

//     return NextResponse.json({ success: true, results });
//   } catch (error: any) {
//     console.error('Cron error:', error);
    
//     // Diagnostic: If it's a model error, fetch the allowed models to see what their key actually supports!
//     if (error.message && error.message.includes('not found for API version v1beta')) {
//       try {
//         const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
//         const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
//         const data = await res.json();
//         const availableModels = data.models ? data.models.map((m: any) => m.name).join(', ') : 'None found/API Disabled';
//         return NextResponse.json({ 
//           error: `API Key Error: ${error.message}. Your key only supports these models: ${availableModels}. Please ensure you used Google AI Studio, not Google Cloud Console.` 
//         }, { status: 500 });
//       } catch (diagError) {
//         // Fallback if diagnostic fails
//       }
//     }

//     return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import Parser from 'rss-parser';

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
  { provider: 'google', model: 'gemini-3.5-flash' },
  { provider: 'google', model: 'gemini-2.0-flash' },
  { provider: 'google', model: 'gemini-flash-latest' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile' }
];

async function generateWithFallback(args: { system: string; prompt: string }) {
  let lastError: any;
  for (const modelDef of MODEL_FALLBACK_CHAIN) {
    try {
      const model = modelDef.provider === 'google' ? google(modelDef.model) : groq(modelDef.model);
      const result = await generateText({ ...args, model });
      return { ...result, modelUsed: modelDef.model };
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || '';
      const isModelAccessIssue =
        msg.includes('not found for API version') ||
        msg.includes('no longer available') ||
        msg.includes('is not supported for generateContent') ||
        msg.includes('fetch failed');
      if (!isModelAccessIssue && modelDef.provider === 'google') throw err; 
      console.warn(`Model ${modelDef.model} unavailable, trying next in fallback chain...`);
    }
  }
  throw lastError;
}

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

      // Try a chain of models - Google has been restricting model access
      // unpredictably for newer API keys mid-project, so don't hardcode one.
      const { text, modelUsed } = await generateWithFallback({
        system: `You are an expert ${agent.domain} persona named ${agent.name}.
        Analyze the provided live news topics and apply strict editorial judgment.
        
        You MUST respond with a raw JSON object and nothing else. Do not use markdown code blocks like \`\`\`json.
        The JSON must match this structure exactly:
        {
          "isWorthy": boolean,
          "text": "String representing your expert post (if worthy), or null",
          "rationale": "String explaining why you accepted or rejected it",
          "sources": ["Only include the EXACT link URL provided in the Recent live news section. Do NOT hallucinate or guess any other URLs."]
        }`,
        prompt,
      });

      let object;
      try {
        // More robust JSON extraction to handle any markdown or extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }
        object = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output:', text);
        results.push({ agentId: agent.id, status: 'error', rationale: 'JSON parse failed' });
        continue;
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
        results.push({ agentId: agent.id, status: 'published', postId: post.id, modelUsed });
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
        results.push({ agentId: agent.id, status: 'rejected', rationale: object.rationale });
      }
    }

    return NextResponse.json({ success: true, results });
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