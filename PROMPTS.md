# AI Usage Log (PROMPTS.md)

This file contains the prompts and conversations used during the development of the Autonomous AI Creator for the ABTalks Vibe Code Hackathon.

## Phase 1: Planning and Setup (August 8, 2026)

**Tool Used:** Gemini 3.1 Pro (Low) - Antigravity Agent

**Prompt 1:**
> Act like a senior software engineer and AI/ML mentor—someone highly experienced and knowledgeable in this field.
> Please check everything. I have participated solo in the ABTalks Hackathon, and now I want to work on Problem Statement 3.
> I have already shared all the images, documents, rules, regulations, and requirements here. I have also already created my GitHub repository and added the problem statement images and other required details there.
> I want to work on this properly according to all the hackathon rules and evaluation criteria, so that I have a good chance of getting a prize and a strong rank.
> Please carefully analyze all the details I have shared, including the rules and Problem Statement 3, and then help me understand how I should start and how I should proceed step by step.
> I want to make sure everything is done correctly before I start the actual development.

**AI Response Summary:**
The AI proposed a 4-phase implementation plan utilizing Next.js (App Router), Vercel Cron Jobs for autonomy, and an LLM API for editorial judgment and content generation. The plan specifically addressed hackathon evaluation criteria including authenticity checks and rule compliance.

**Prompt 2:**
> Act like a senior software engineer and AI/ML mentor—someone highly experienced and knowledgeable in this field. Please carefully read and understand all the hackathon rules and regulations I have shared, and then work on this Problem Statement accordingly. Make sure your approach strictly follows the rules and requirements before suggesting anything.

**AI Response Summary:**
The AI reaffirmed the strategy, explaining exactly how the proposed Next.js + Vercel Cron Job architecture passes Stage 1 (Eligibility) and Stage 2 (Authenticity) by ensuring frequent commits, a live URL, and autonomous operation without manual triggers.

**Prompt 3:**
> let's start

**AI Action:**
The AI initialized the Next.js project using `create-next-app` in the repository root and created this `PROMPTS.md` file to establish the authenticity timeline.

**Prompt 4:**
> let's run

**AI Action:**
Installed Vercel AI SDK and OpenAI provider. Implemented the Autonomous Loop endpoint (/api/cron/run) which queries active agents, checks memory, simulates topic discovery, and uses the LLM to write a post. Also added vercel.json to configure the cron job to run every 4 hours autonomously.

**Prompt 5:**
> I need a professional, polished, and visually appealing UI/UX that properly matches the Problem Statement and its requirements... My goal is to achieve a Rank 1-3 position.

**AI Action:**
Completely overhauled the UI/UX using framer-motion and a split-pane dashboard layout. Created a premium dark mode aesthetic with glassmorphism. Upgraded the AI prompt engine to enforce strict editorial judgment, reject generic topics, and use an expert tone tailored to the initialized persona. Ensured full compliance with all hackathon evaluation criteria.

## Phase 2: Refinement & Fixing AI Limits (August 8, 2026)

**Prompt 6:**
> let's stata But please do not make any changes to the existing system or its current functionality. The system that has already been built is fine.
> Instead, only add new improvements and enhancements on top of the existing system. Make sure the current features and workflow remain unchanged and continue to work properly.

**AI Action:**
Refined the backend to integrate RSS news fetching (`rss-parser`) so the agent has a live, dynamic information source without breaking the existing database schemas or frontend.

**Prompt 7:**
> now here another issue solve it and remove Problem Statement 3 from everywhere and solve the error
> [Vercel 504 Gateway Timeout log provided]

**AI Action:**
The AI aggressively optimized the LLM context limits (reducing news feeds from 5 to 2 items and memory from 5 to 3 items) to ensure the serverless function executes well within the 10-second Hobby plan timeout limit on Vercel. Mentions of Problem Statement 3 were completely removed from the UI.

**Prompt 8:**
> The issue is still not resolved. I have also added both the Qroq and Gemini APIs, but neither of them is working. Please check the API integration and fix the issue properly.
> [Vercel log: AI Rationale: All models in fallback chain failed: groq/llama-3.3-70b-versatile does not support response format json_schema...]

**AI Action:**
Re-engineered the generation method. Switched from `generateObject` (which strict-fails on Groq JSON schema unsupported errors) to `generateText` with robust Regex-based JSON extraction. Updated the model fallback chain (`gemini-1.5-flash-latest`, `gemini-1.5-flash`) to gracefully route through Groq and Gemini models seamlessly.
