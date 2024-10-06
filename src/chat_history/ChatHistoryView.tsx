import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import {
  WorkspaceLeaf,
  ItemView,
  App
} from 'obsidian';
import { ChatHistoryComponent } from "@/src/chat_history/ChatHistoryComponent";

export const VIEW_TYPE_CHAT_HISTORY = "chat-history-view";

export class ChatHistoryView extends ItemView {
  root: Root | null = null;
  app: App;
  chatHistoryPath: string;

  constructor(leaf: WorkspaceLeaf, app: App, chatHistoryPath: string) {
    super(leaf);
    this.app = app;
    this.chatHistoryPath = chatHistoryPath;
  }

  getViewType() {
    return VIEW_TYPE_CHAT_HISTORY;
  }

  getDisplayText() {
    return "Chat History";
  }

  getIcon(): string {
    return "history";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <ChatHistoryComponent app={this.app} chatHistoryPath={this.chatHistoryPath} />
      </StrictMode>,
   );
  }

  async onClose() {
    this.root?.unmount();
  }
}