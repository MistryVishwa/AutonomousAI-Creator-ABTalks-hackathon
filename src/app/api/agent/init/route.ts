import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { persona } = body;
    
    if (!persona || !persona.name || !persona.domain) {
      return NextResponse.json({ error: 'Missing persona details' }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name: persona.name,
        domain: persona.domain,
      },
    });

    return NextResponse.json({ agentId: agent.id });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
