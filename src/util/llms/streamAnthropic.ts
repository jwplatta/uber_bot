import { Anthropic } from '@anthropic-ai/sdk';

export interface StreamAnthropicOptions {
  anthropic: Anthropic;
  model: string;
  prompt: string;
  onToken: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
}

/**
 * Streams a completion from Anthropic API
 */
export async function streamAnthropic({
  anthropic,
  model,
  prompt,
  onToken,
  onComplete
}: StreamAnthropicOptions): Promise<void> {
  try {
    const stream = await anthropic.messages.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.text) {
        onToken(chunk.delta.text);
        fullResponse += chunk.delta.text;
      }
    }
    
    if (onComplete) {
      onComplete(fullResponse);
    }
  } catch (error) {
    console.error('Anthropic streaming error:', error);
    throw error;
  }
}