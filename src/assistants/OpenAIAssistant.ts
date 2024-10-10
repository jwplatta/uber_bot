import OpenAI from 'openai';
import { Assistant, Content } from "@/src/assistants/types";

export class OpenAIAssistant implements Assistant {
  model: string;
  systemText: string;
  stream: boolean;
  openai: OpenAI;

  constructor(apiKey: string, model: string, systemText: string, stream: boolean) {
    this.model = model;
    this.systemText = systemText;
    this.stream = stream;
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async response(params: any): Promise<Content> {
    const messagesContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: params.noteContext === "" ? this.systemText : this.systemText + "\n###\nCONTEXT:\n" + params.noteContext
      },
      ...params.messages as OpenAI.Chat.ChatCompletionMessageParam[]
    ];
    messagesContext.push(params.newMessage as OpenAI.Chat.ChatCompletionMessageParam);

    const chatParams: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: messagesContext,
      model: this.model,
      stream: false
    };

    const completion = await this.openai.chat.completions.create(chatParams);

    return { content: completion.choices[0].message.content || '' };
  }

  async *streamResponse(params: any): AsyncGenerator<Content> {
    const messagesContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: params.noteContext === "" ? this.systemText : this.systemText + "\n###\nCONTEXT:\n" + params.noteContext
      },
      ...params.messages as OpenAI.Chat.ChatCompletionMessageParam[]
    ];

    messagesContext.push(params.newMessage as OpenAI.Chat.ChatCompletionMessageParam);

    const chatParams: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: messagesContext,
      model: this.model,
      stream: true
    };

    const completion = await this.openai.chat.completions.create(chatParams);
    for await (const chunk of completion) {
      const contentChunk = chunk.choices[0].delta?.content || '';
      yield { content: contentChunk };
    }
  }
}