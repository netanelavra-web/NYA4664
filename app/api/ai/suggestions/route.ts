import { NextRequest, NextResponse } from 'next/server';
import { generateWritingSuggestions } from '@/lib/ai/openai';
import type { EmotionTone } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tone, partialText, locale } = body;

    if (!tone || !locale) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const response = await generateWritingSuggestions({
      tone: tone as EmotionTone,
      partialText,
      locale: locale as 'he-IL' | 'en-US',
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to generate suggestions',
        },
      },
      { status: 500 }
    );
  }
}
