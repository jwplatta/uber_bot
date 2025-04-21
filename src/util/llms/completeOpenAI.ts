import { OpenAI } from 'openai';

export interface CompleteOpenAIOptions {
  openai: OpenAI;
  model: string;
  prompt: string;
}

/**
 * Sends a completion request to OpenAI API
 */
export async function completeOpenAI({
  openai,
  model,
  prompt
}: CompleteOpenAIOptions): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });
    
    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('OpenAI completion error:', error);
    throw error;
  }
}