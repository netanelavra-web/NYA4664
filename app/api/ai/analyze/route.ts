import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessageEmotion } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, locale } = body;

    if (!content || !locale) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const analysis = await analyzeMessageEmotion(
      content,
      locale as 'he-IL' | 'en-US'
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to analyze message',
        },
      },
      { status: 500 }
    );
  }
}
