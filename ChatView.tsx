import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ChatComponent } from "./ChatComponent";
import {
  WorkspaceLeaf,
  ItemView,
  App,
  TFile
} from 'obsidian';
import { NoteSecretarySettings } from './main'

export const VIEW_TYPE_CHAT = "chat-view";

export class ChatView extends ItemView {
  root: Root | null = null;
  app: App;
  settings: NoteSecretarySettings;
  assistantFile: TFile | null = null;

  constructor(leaf: WorkspaceLeaf, app: App, settings: NoteSecretarySettings, assistantFile: TFile | null) {
    super(leaf);
    this.app = app;
    this.settings = settings;
    this.assistantFile = assistantFile;
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

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <ChatComponent app={this.app} settings={this.settings} assistantFile={this.assistantFile} />
      </StrictMode>,
   );
  }

  async onClose() {
    this.root?.unmount();
  }
}