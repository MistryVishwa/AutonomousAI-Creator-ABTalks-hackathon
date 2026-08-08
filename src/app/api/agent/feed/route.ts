import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId parameter' }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        text: true,
        rationale: true,
        sources: true,
      }
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      createdAt: post.createdAt.toISOString(),
      text: post.text,
      rationale: post.rationale,
      sources: JSON.parse(post.sources),
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
