import { Anthropic } from '@anthropic-ai/sdk';

export interface CompleteAnthropicOptions {
  anthropic: Anthropic;
  model: string;
  prompt: string;
}

/**
 * Sends a completion request to Anthropic API
 */
export async function completeAnthropic({
  anthropic,
  model,
  prompt
}: CompleteAnthropicOptions): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('Anthropic completion error:', error);
    throw error;
  }
}