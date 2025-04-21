import { OpenAI } from 'openai';

export interface StreamOpenAIOptions {
  openai: OpenAI;
  model: string;
  prompt: string;
  onToken: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
}

/**
 * Streams a completion from OpenAI API
 */
export async function streamOpenAI({
  openai,
  model,
  prompt,
  onToken,
  onComplete
}: StreamOpenAIOptions): Promise<void> {
  try {
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onToken(content);
        fullResponse += content;
      }
    }

    if (onComplete) {
      onComplete(fullResponse);
    }
  } catch (error) {
    console.error('OpenAI streaming error:', error);
    throw error;
  }
}