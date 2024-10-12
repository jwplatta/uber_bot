import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ChatComponent } from "@/src/chat/ChatComponent";
import {
  WorkspaceLeaf,
  ItemView,
  App,
  TFile,
  ViewStateResult
} from 'obsidian';
import { NoteSecretarySettings } from '@/src/settings/NoteSecretarySettings';

export const VIEW_TYPE_CHAT = "chat-view";

interface ChatViewState {
  assistantFile: TFile | null;
  noteContextFile: TFile | null;
}

export class ChatView extends ItemView implements ChatViewState {
  root: Root | null = null;
  app: App;
  settings: NoteSecretarySettings;
  assistantFile: TFile | null = null;
  noteContextFile: TFile | null = null;

  constructor(
    readonly leaf: WorkspaceLeaf,
    app: App,
    settings: NoteSecretarySettings,
    assistantFile: TFile | null,
    noteContextFile: TFile | null
  ) {
    super(leaf);
    this.app = app;
    this.settings = settings;
    this.assistantFile = assistantFile;
    this.noteContextFile = noteContextFile;
  }

  setState(state: any, result: ViewStateResult): Promise<void> {
    if (state.assistantFile) {
      this.assistantFile = state.assistantFile;
    }

    if (state.noteContextFile) {
      this.noteContextFile = state.noteContextFile;
    } else {
      this.noteContextFile = null;
    }

    this.render();

    return super.setState(state, result);
  }

  getState(): ChatViewState {
    return {
      assistantFile: this.assistantFile,
      noteContextFile: this.noteContextFile
    };
  }

  getViewType() {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText() {
    return "Chat view";
  }

  getIcon(): string {
    return "bot";
  }

  async render () {
    const container = this.containerEl.children[1];
    container.empty();
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <ChatComponent
          app={this.app}
          settings={this.settings}
          assistantFile={this.assistantFile}
          noteContextFile={this.noteContextFile}
          chatView={this} />
      </StrictMode>,
   );
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.root?.unmount();
  }
}