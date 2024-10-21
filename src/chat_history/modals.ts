import { TFile, App, FuzzySuggestModal} from 'obsidian';
import { UberBotSettings } from '@/src/settings/UberBotSettings';

interface Chat {
	file: TFile;
	content: string;
}

export class SearchChatHistory extends FuzzySuggestModal<Chat> {
	app: App;
	settings: UberBotSettings;
	chats: Chat[];

	constructor(app: App, settings: UberBotSettings) {
		super(app);
		this.app = app;
		this.settings = settings;
		const files = this.app.vault.getMarkdownFiles().filter((file: TFile) => {
			return file.path.includes(this.settings.chatHistory.chatHistoryPath);
		});

		this.chats = files.map((file: TFile) => {
			const fc = app.metadataCache.getFileCache(file);
			const tags = fc?.frontmatter?.tags || "";
			return {
				file: file,
				content: file.basename + ": " + tags
			};
		});
	}

  getItems(): Chat[] {
		return this.chats;
  }

  getItemText(chat: Chat): string {
		return chat.content;
  }

  async onChooseItem(chat: Chat, evt: MouseEvent | KeyboardEvent) {
    await this.app.workspace.getLeaf().openFile(chat.file);
  }
}
