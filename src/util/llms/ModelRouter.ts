import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { Ollama } from 'ollama';
import { UberBotSettings } from '@/settings/UberBotSettings';

// Import completion functions
import { completeOpenAI } from './completeOpenAI';
import { completeOllama } from './completeOllama';
import { completeAnthropic } from './completeAnthropic';

// Import streaming functions
import { streamOpenAI } from './streamOpenAI';
import { streamLlama } from './streamLlama';
import { streamAnthropic } from './streamAnthropic';

export type ModelType = 'openai' | 'ollama' | 'anthropic';

export interface ModelRouterOptions {
  settings: UberBotSettings;
  modelType: ModelType;
  prompt: string;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
}

/**
 * Routes a completion or streaming request to the appropriate LLM provider
 * based on the specified model type.
 */
export async function routeModelRequest({
  settings,
  modelType,
  prompt,
  onToken,
  onComplete
}: ModelRouterOptions): Promise<string | void> {
  
  const shouldStream = !!onToken;
  
  switch (modelType) {
    case 'openai': {
      const openai = new OpenAI({
        apiKey: settings.openAI.key,
      });
      
      if (shouldStream) {
        return streamOpenAI({
          openai,
          model: settings.openAI.model,
          prompt,
          onToken,
          onComplete
        });
      } else {
        return completeOpenAI({
          openai,
          model: settings.openAI.model,
          prompt
        });
      }
    }
    
    case 'ollama': {
      const ollama = new Ollama({
        host: settings.ollama.host
      });
      
      if (shouldStream) {
        return streamLlama({
          ollama,
          model: settings.ollama.model,
          prompt,
          onToken,
          onComplete
        });
      } else {
        return completeOllama({
          ollama,
          model: settings.ollama.model,
          prompt
        });
      }
    }
    
    case 'anthropic': {
      const anthropic = new Anthropic({
        apiKey: settings.anthropic.key,
      });
      
      if (shouldStream) {
        return streamAnthropic({
          anthropic,
          model: settings.anthropic.model,
          prompt,
          onToken,
          onComplete
        });
      } else {
        return completeAnthropic({
          anthropic,
          model: settings.anthropic.model,
          prompt
        });
      }
    }
    
    default:
      throw new Error(`Unsupported model type: ${modelType}`);
  }
}