import { Ollama } from 'ollama';
import { Assistant, Content } from '@/src/assistants/types';

export class OllamaAssistant implements Assistant {
  ollama: Ollama;
  model: string;
  systemText: string;
  stream: boolean;

  constructor(host: string, model: string, systemText: string, stream: boolean) {
    this.model = model;
    this.systemText = systemText;
    this.stream = stream;
    this.ollama = new Ollama({ host: host });
  }

  async response(params: any): Promise<Content> {
    const messagesContext = [
      {
        role: "system",
        content: params.noteContext === "" ? this.systemText : this.systemText + "\n###\nCONTEXT:\n" + params.noteContext
      },
      ...params.messages
    ];
    messagesContext.push(params.newMessage);

    const response = await this.ollama.chat({
      model: this.model,
      messages: messagesContext,
      stream: false
    });

    return { content: response.message.content };
  }

  async *streamResponse(params: any) {
    const messagesContext = [
      {
        role: "system",
        content: params.noteContext === "" ? this.systemText : this.systemText + "\n###\nCONTEXT:\n" + params.noteContext
      },
      ...params.messages
    ];
    messagesContext.push(params.newMessage);

    const stream = await this.ollama.chat({
      model: this.model,
      messages: messagesContext,
      stream: true
    });

    for await (const chunk of stream) {
      yield { content: chunk.message.content };
    }
  }
}