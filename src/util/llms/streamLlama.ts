import { Ollama } from 'ollama';

export interface StreamLlamaOptions {
  ollama: Ollama;
  model: string;
  prompt: string;
  onToken: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
}

/**
 * Streams a completion from Ollama API
 */
export async function streamLlama({
  ollama,
  model,
  prompt,
  onToken,
  onComplete
}: StreamLlamaOptions): Promise<void> {
  try {
    const stream = await ollama.chat({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.message?.content || '';
      if (content) {
        onToken(content);
        fullResponse += content;
      }
    }
    
    if (onComplete) {
      onComplete(fullResponse);
    }
  } catch (error) {
    console.error('Ollama streaming error:', error);
    throw error;
  }
}