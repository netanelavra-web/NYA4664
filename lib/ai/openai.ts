import OpenAI from 'openai';
import type { EmotionTone, AIEmotion, AIPromptResponse, AIAnalysisResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// PROMPT HELPER - Suggests writing prompts
// ============================================================================

export async function generateWritingSuggestions(
  context: {
    tone: EmotionTone;
    partialText?: string;
    locale: 'he-IL' | 'en-US';
  }
): Promise<AIPromptResponse> {
  const isHebrew = context.locale === 'he-IL';

  const systemPrompt = isHebrew
    ? `אתה עוזר כתיבה עדין ורגיש. עזור למשתמשים לכתוב הודעות רגשיות לעצמם בעתיד.
הטון הרצוי: ${getToneDescription(context.tone, 'he-IL')}.
הצע 3 משפתי פתיחה או רעיונות להמשך. היה אמפתי ומעודד.`
    : `You are a gentle, empathetic writing assistant. Help users write emotional messages to their future selves.
Desired tone: ${getToneDescription(context.tone, 'en-US')}.
Suggest 3 opening sentences or ideas for continuation. Be empathetic and encouraging.`;

  const userPrompt = context.partialText
    ? isHebrew
      ? `המשתמש כתב עד כה: "${context.partialText}"\n\nהצע המשכים אפשריים.`
      : `The user has written so far: "${context.partialText}"\n\nSuggest possible continuations.`
    : isHebrew
    ? 'הצע משפתי פתיחה להודעה.'
    : 'Suggest opening sentences for a message.';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    const suggestions = content.split('\n').filter(s => s.trim().length > 0);

    return {
      suggestions: suggestions.slice(0, 3),
      tone: context.tone,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate suggestions');
  }
}

// ============================================================================
// EMOTIONAL ANALYSIS - Analyzes message content
// ============================================================================

export async function analyzeMessageEmotion(
  content: string,
  locale: 'he-IL' | 'en-US'
): Promise<AIAnalysisResponse> {
  const isHebrew = locale === 'he-IL';

  const systemPrompt = isHebrew
    ? `נתח את הטון הרגשי והמילות המפתח של ההודעה הבאה.
החזר תוצאה במבנה JSON עם:
- emotion: אחד מ-positive, calm, grieving, nostalgic, hopeful
- tone: אחד מ-encouragement, gratitude, reflection, farewell, hope, other
- keywords: מערך של 3-5 מילות מפתח
- confidence: מספר בין 0-1`
    : `Analyze the emotional tone and keywords of the following message.
Return a JSON structure with:
- emotion: one of positive, calm, grieving, nostalgic, hopeful
- tone: one of encouragement, gratitude, reflection, farewell, hope, other
- keywords: array of 3-5 keywords
- confidence: number between 0-1`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      emotion: result.emotion as AIEmotion,
      tone: result.tone as EmotionTone,
      keywords: result.keywords || [],
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Return default analysis
    return {
      emotion: 'calm',
      tone: 'other',
      keywords: [],
      confidence: 0,
    };
  }
}

// ============================================================================
// MONTHLY INSIGHTS - Generate summary of user's messages
// ============================================================================

export async function generateMonthlyInsights(
  messages: Array<{
    emotionTone: EmotionTone;
    aiEmotion?: AIEmotion;
    aiKeywords?: string[];
  }>,
  locale: 'he-IL' | 'en-US'
): Promise<{ summaryText: string; topThemes: string[] }> {
  const isHebrew = locale === 'he-IL';

  // Count emotions
  const emotionCounts: Record<string, number> = {};
  const allKeywords: string[] = [];

  messages.forEach(msg => {
    const emotion = msg.aiEmotion || 'calm';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    if (msg.aiKeywords) {
      allKeywords.push(...msg.aiKeywords);
    }
  });

  // Get top themes (most common keywords)
  const keywordCounts: Record<string, number> = {};
  allKeywords.forEach(kw => {
    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
  });

  const topThemes = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  const systemPrompt = isHebrew
    ? `צור סיכום רגשי חודשי עבור משתמש על בסיס הסטטיסטיקות הבאות.
היה אמפתי, מעודד, ומדגיש תובנות.
כתוב 2-3 משפטים בעברית.`
    : `Create a monthly emotional summary for a user based on the following statistics.
Be empathetic, encouraging, and highlight insights.
Write 2-3 sentences in English.`;

  const statsText = `
Messages written: ${messages.length}
Emotion breakdown: ${JSON.stringify(emotionCounts)}
Top themes: ${topThemes.join(', ')}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: statsText },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summaryText = response.choices[0]?.message?.content || '';

    return {
      summaryText,
      topThemes,
    };
  } catch (error) {
    console.error('OpenAI insights error:', error);
    return {
      summaryText: isHebrew
        ? `החודש כתבת ${messages.length} הודעות. המשך כך!`
        : `This month you wrote ${messages.length} messages. Keep it up!`,
      topThemes,
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getToneDescription(tone: EmotionTone, locale: 'he-IL' | 'en-US'): string {
  const descriptions = {
    'he-IL': {
      encouragement: 'מעודד ותומך',
      gratitude: 'מלא תודה והערכה',
      reflection: 'רפלקטיבי ומעמיק',
      farewell: 'פרידה חמה',
      hope: 'מלא תקווה ואופטימיות',
      other: 'אישי וייחודי',
    },
    'en-US': {
      encouragement: 'encouraging and supportive',
      gratitude: 'full of gratitude and appreciation',
      reflection: 'reflective and deep',
      farewell: 'warm farewell',
      hope: 'full of hope and optimism',
      other: 'personal and unique',
    },
  };

  return descriptions[locale][tone] || descriptions[locale].other;
}
