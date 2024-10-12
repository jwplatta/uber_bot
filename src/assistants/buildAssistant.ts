import { NoteSecretarySettings } from '@/src/settings/NoteSecretarySettings';
import { App, TFile } from 'obsidian';
import { OpenAIModels, OllamaModels } from '@/src/settings/llmModels';
import { OpenAIAssistant } from '@/src/assistants/OpenAIAssistant';
import { OllamaAssistant } from '@/src/assistants/OllamaAssistant';
import { Assistant } from '@/src/assistants/types';

export async function buildAssistant(app: App, assistantFile: TFile, settings: NoteSecretarySettings): Promise<Assistant> {
  const fileMetadata = app.metadataCache.getFileCache(assistantFile)
  if (!fileMetadata) {
    return {
      model: "",
      systemText: "",
      stream: false,
      streamResponse: async function* (params: any) {
        yield { content: "" };
      },
      response: async function (params: any) {
        return { content: "" };
      }
    };
  }
  const model = fileMetadata.frontmatter?.model;
  const stream = fileMetadata.frontmatter?.stream || false;

  const assistantFileText = await app.vault.read(assistantFile);

  let sysText = "";
  if(fileMetadata && fileMetadata.frontmatterPosition?.end.line !== undefined) {
    sysText = assistantFileText.split('\n').slice(
      fileMetadata.frontmatterPosition?.end.line + 1
    ).join('\n')
  }

  let assistant: Assistant = {
    model: "",
    systemText: "",
    stream: stream,
    streamResponse: async function* (params: any) {
      yield { content: "" };
    },
    response: async function (params: any) {
      return { content: "" };
    }
  };

  if (OpenAIModels.includes(model)) {
    assistant = new OpenAIAssistant(
      settings.openAI.key,
      model,
      sysText,
      stream
    );

    return assistant;
  } else if (OllamaModels.includes(model)) {
    assistant = new OllamaAssistant(
      settings.ollama.host,
      model,
      sysText,
      stream
    );

    return assistant;
  } else {
    return assistant;
  }
}