import { Ollama } from 'ollama';

export interface CompleteOllamaOptions {
  ollama: Ollama;
  model: string;
  prompt: string;
}

/**
 * Sends a completion request to Ollama API
 */
export async function completeOllama({
  ollama,
  model,
  prompt
}: CompleteOllamaOptions): Promise<string> {
  try {
    const response = await ollama.chat({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    return response.message.content;
  } catch (error) {
    console.error('Ollama completion error:', error);
    throw error;
  }
}