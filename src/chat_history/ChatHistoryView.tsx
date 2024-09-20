import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import {
  WorkspaceLeaf,
  ItemView,
  App
} from 'obsidian';

export const VIEW_TYPE_CHAT_HISTORY = "chat-history-view";

export class ChatHistoryView extends ItemView {
  root: Root | null = null;
  app: App;

  constructor(leaf: WorkspaceLeaf, app: App) {
    super(leaf);
    this.app = app;
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
        <div>
          <h1>Chat History</h1>
         </div>
      </StrictMode>,
   );
  }

  async onClose() {
    this.root?.unmount();
  }
}