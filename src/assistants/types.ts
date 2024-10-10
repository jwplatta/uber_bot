export interface Assistant {
  model: string;
  systemText: string;
  stream: boolean;
  streamResponse: (params: any) => AsyncIterable<{ content: string }>;
  response: (params: any) => Promise<{ content: string }>;
}

export interface Content {
  content: string;
}