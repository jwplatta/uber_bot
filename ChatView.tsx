import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ChatComponent } from "./ChatComponent";
import {
  WorkspaceLeaf,
  ItemView,
  App
} from 'obsidian';

const VIEW_TYPE_CHAT = "chat-view";

export class ChatView extends ItemView {
  root: Root | null = null;
  app: App;

  constructor(leaf: WorkspaceLeaf, app: App) {
    super(leaf);
    this.app = app;
  }

  getViewType() {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText() {
    return "Chat view";
  }

  getIcon(): string {
    return "bot"; // You can replace this with any Obsidian built-in icon name
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    // container.createEl("h1", { text: "Chat view" });
    // container.createEl("textarea", { value: "foobar" });
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <ChatComponent app={this.app} />
      </StrictMode>,
   );
  }

  async onClose() {
    this.root?.unmount();
  }
}