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
