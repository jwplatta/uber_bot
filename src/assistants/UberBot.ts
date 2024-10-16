import { App, TFile } from "obsidian";
import { Ollama } from 'ollama';
import { UberBotSettings } from '@/src/settings/UberBotSettings';
import { Assistant, Content } from "@/src/assistants/types";

const decompositionTemplate = `GENERAL INSTRUCTIONS
You are a domain expert. Your task is to break down a complex request into simpler sub-parts. Return the sub-parts as only valid JSON in the ANSWER FORMAT.

USER REQUEST
{{request}}

AVAILABLE HELPERS
{{helper_names}}

AVAILABLE TOOLS
{{tool_names}}

ANSWER FORMAT
{"sub-parts":["<FILL>"]}`

const chainOfThoughtTemplate = `GENERAL INSTRUCTIONS
You are a domain expert. Your task is to provide a step by step solution to a complex request. Return the steps as only valid JSON in the ANSWER FORMAT.

USER REQUEST
{{request}}

AVAILABLE HELPERS
{{helper_names}}

AVAILABLE TOOLS
{{tool_names}}

ANSWER FORMAT
{"steps":["<FILL>"]}`
;

const buildHelperPrompt = (promptTemplate: string, request: string, tools: string[], helpers: string[]) => {
  return promptTemplate
    .replace("{{request}}", request)
    .replace("{{tool_names}}", tools.join("\n- "))
    .replace("{{helper_names}}", helpers.join("\n- "));
}

const controlTemplate = `GENERAL INSTRUCTIONS
Your task is to fulfill user requests. If you cannot immediately fulfill the request, then use a HELPER or a TOOL. Fill with Nil where no TOOL or HELPER is required.

AVAILABLE TOOLS
{{tool_names}}

AVAILABLE HELPERS
{{helper_names}}

CONTEXTUAL INFORMATION
{{context}}

REQUEST
{{user_request}}

ANSWER FORMAT
{"Tool_Request": "<Fill>", "Helper_Request "<Fill>"}`

const buildControlPrompt = (tools: string[], helpers: string[], context: string, user_request: string) => {
  return controlTemplate
    .replace("{{tool_names}}", tools.join("\n- "))
    .replace("{{helper_names}}", helpers.join("\n- "))
    .replace("{{context}}", context)
    .replace("{{user_request}}", user_request)
}

const moveFile = async (app: App, file: TFile, destPath: string) => {
  try {
    await app.fileManager.renameFile(file, destPath);
    return true;
  } catch (e) {
    return false;
  }
}

const filterFiles = async (app: App, filter: string) => {
  try {
    const files = await app.vault.getFiles();
    return files.filter((file) => file.path.includes(filter));
  } catch (e) {
    return [];
  }
}

interface Step {
  order:  number;
  prompt: string;
  function: string;
  result: string;
}

export class UberBot implements Assistant {
  tools = {
    moveFile: {
      function: moveFile,
      description: "Moves a file to the destination path",
      parameters: {
        file: {
          type: TFile,
          description: "The file to move"
        },
        destPath: {
          type: string,
          description: "The destination path"
        }
      }
    },
    filterFiles: {
      function: filterFiles,
      description: "Filters files based on a string",
      parameters: {
        filter: {
          type: string,
          description: "The string to filter files by"
        }
      }
    }
  };
  helpers = {
    chainOfThought: {
      function: chainOfThoughtTemplate,
      description: "Provides a step by step solution to a complex request",
      parameters: {
        request: {
          type: string,
          description: "The user request"
        },
        tools: {
          type: string[],
          description: "The available tools"
        },
        helpers: {
          type: string[],
          description: "The available helpers"
        }
      }
    },
    problemDecomposition: {
      function: decompositionTemplate,
      description: decompositionTemplate,
      parameters: {
        request: {
          type: string,
          description: "The user request"
        },
        tools: {
          type: string[],
          description: "The available tools"
        },
        helpers: {
          type: string[],
          description: "The available helpers"
        }
      }
    }
  }

  model: string;
  app: App;
  settings: UberBotSettings;
  ollama: Ollama;
  host: string;
  stream: boolean;
  systemText: string;

  constructor(host: string, model: string, app: App, settings: UberBotSettings) {
    this.host = host;
    this.model = model;
    this.app = app;
    this.settings = settings;
    this.ollama = new Ollama({ host: host });

    this.stream = false;
    this.systemText = "";
  }

  async response(params: any): Promise<Content> {
    const context = params.messages.map((message: any) => {
        return `${message.role}: ${message.content}`
    }).join("\n");

    const completion = await this.ollama.generate({
      model: this.model,
      prompt: buildControlPrompt(
        Object.keys(this.tools),
        Object.keys(this.helpers),
        context,
        params.newMessage.content
      ),
    });

    const instructions = JSON.parse(completion.response);
    console.log(instructions);

    if(instructions.Helper_Request !== "Nil") {
      let prompt = "";
      if (instructions.Helper_Request === "chainOfThought") {
        prompt = buildHelperPrompt(
          this.helpers.chainOfThought,
          params.newMessage.content,
          Object.keys(this.tools),
          Object.keys(this.helpers)
        );
      } else if (instructions.Helper_Request === "problemDecomposition") {
        prompt = buildHelperPrompt(
          this.helpers.problemDecomposition,
          params.newMessage.content,
          Object.keys(this.tools),
          Object.keys(this.helpers)
        );
      }

      console.log("HELPER Prompt: ", prompt);

      const completion = await this.ollama.generate({
        model: this.model,
        prompt: prompt
      });
      console.log(completion)

      const response = JSON.parse(completion.response);
      console.log(response);
    }
    // if (response.Tool_Request !== "Nil") {
    //   const tool = this.tools[response.Tool_Request];
    //   const result = await tool(this.app, params.noteContext, params.newMessage.content);
    //   return { content: result ? "Success" : "Failure" };
    // }

    return { content: "RESPONSE NOT IMPLEMENTED" };
  }

  async *streamResponse(params: any): AsyncGenerator<Content> {
    yield { content: "STREAMING NOT IMPLEMENTED" };
  }
}
