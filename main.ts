import {
  App, WorkspaceLeaf,
  MarkdownView,
	Plugin,
	// PluginSettingTab,
	// SuggestModal,
	TFile,
	FuzzySuggestModal
} from 'obsidian';
import { VIEW_TYPE_CHAT, ChatView } from "@/src/chat/ChatView";
import { VIEW_TYPE_CHAT_HISTORY, ChatHistoryView } from "@/src/chat_history/ChatHistoryView";
import { SelectEditAssistanModal, AssistantFormModal } from '@/src/assistants/modals';
import SearchAssistantModal from '@/src/SearchAssistantModal';
import { UberBotSettings, DEFAULT_SETTINGS } from '@/src/settings/UberBotSettings';
import { UberBotSettingTab } from '@/src/settings/UberBotSettingTab'

export default class UberBot extends Plugin {
	settings: UberBotSettings;

	async onload() {
		await this.loadSettings();

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => {
				// const defaultAssistantFile = this.app.vault.getFileByPath(this.settings.assistants.assistant)
				return new ChatView(leaf, this.app, this.settings, null, null)
			}
    );

		this.registerView(
			VIEW_TYPE_CHAT_HISTORY,
			(leaf) => new ChatHistoryView(leaf, this.app, this.settings.chatHistory.chatHistoryPath)
		);

		// this.app.vault.on('modify', (file) => {
		// 	console.log('File modified: ', file.path);
		// })

		const ribbonIconEl = this.addRibbonIcon('bot', 'UberBot', (evt: MouseEvent) => {
      this.activateChatView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('uber-bot-ribbon-class');
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Uber Bot Status');

		this.addCommand({
			id: 'open-chat-history',
			name: 'Chat History',
			callback: () => {
				this.activateChatHistoryView();
			}
		})

		this.addCommand({
			id: 'select-assistant',
			name: 'Select Assistant',
			callback: () => {
				new SearchAssistantModal(this.app, this.settings, this).open();
			}
		});

		this.addCommand({
			id: 'create-assistant',
			name: 'Create Assistant',
			callback: () => {
				new AssistantFormModal(this.app, this.settings, null).open()
			}
		})

		this.addCommand({
			id: 'edit-assistant',
			name: 'Edit Assistant',
			callback: () => {
				new SelectEditAssistanModal(this.app, this.settings).open();
			}
		})

		this.addCommand({
			id: 'chat-with-note',
			name: 'Chat with note',
			callback: () => {
				new SearchAssistantModal(this.app, this.settings, this, true).open();
			}
		});

		this.addCommand({
			id: 'search-chat-history',
			name: 'Search Chat History',
			callback: async () => {
				new SearchChatHistory(this.app, this.settings).open();
			}
		})

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						// new ChatModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new UberBotSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });
	}

	onunload() {}

	async activateChatHistoryView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT_HISTORY);
		if (leaves.length > 0 ) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_CHAT_HISTORY, active: true });
		}

		if(leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async startNewChat(assistantFile: TFile, noteContextFile: TFile | null = null) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
		}

		await leaf?.setViewState(
			{
				type: VIEW_TYPE_CHAT,
				active: true,
				state: {
					assistantFile: assistantFile,
					noteContextFile: noteContextFile
				}
			}
		);

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

  async activateChatView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
			leaf = workspace.getRightLeaf(false);
			const defaultAssistantFile = this.app.vault.getFileByPath(this.settings.assistants.assistant)
      await leaf?.setViewState(
				{
					type: VIEW_TYPE_CHAT,
					active: true,
					state: { assistantFile: defaultAssistantFile }
				}
			);
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		const assistantsDir = this.app.vault.getFolderByPath(
			this.settings.assistants.assistantDefinitionsPath
		)

		if (!assistantsDir) {
			this.app.vault.createFolder(
				this.settings.assistants.assistantDefinitionsPath
			)

			const defaultAssistantPath = this.settings.assistants.assistantDefinitionsPath + "/DefaultAssistant.md";
			const defaultAssistantFrontmatter = `---\nassistant: DefaultAssistant.md\npath: ${defaultAssistantPath}\n---`;
			const defaultAssistant = `${defaultAssistantFrontmatter}\nYou are a helpful assistant.`
			this.app.vault.create(
				defaultAssistantPath,
				defaultAssistant
			).catch(() => {
				console.log("Unable to create DefaultAssistant")
			})
		}

		const chatHistoryDir = this.app.vault.getFolderByPath(
			this.settings.chatHistory.chatHistoryPath
		)
		if (!chatHistoryDir) {
			this.app.vault.createFolder(
				this.settings.chatHistory.chatHistoryPath
			)
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface Chat {
	file: TFile;
	content: string;
}

class SearchChatHistory extends FuzzySuggestModal<Chat> {
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

// class SelectEditAssistanModal extends SuggestModal<TFile> {
// 	app: App;
// 	settings: UberBotSettings;
// 	assistantFiles: TFile[];

// 	constructor(app: App, settings: UberBotSettings) {
// 		super(app);
// 		this.app = app;
// 		this.settings = settings;

// 		const files = this.app.vault.getMarkdownFiles();
// 		this.assistantFiles = files.filter((file: TFile) => {
// 			return file.path.includes(this.settings.assistants.assistantDefinitionsPath);
// 		})
// 	}

// 	async getSuggestions(query: string): Promise<TFile[]> {
// 		const filteredAssistants = this.assistantFiles.filter((assistant) => {
// 			return assistant.basename.toLowerCase().includes(query.toLowerCase());
// 		});

// 		return filteredAssistants;
// 	}

// 	renderSuggestion(assistantFile: TFile, el: HTMLElement) {
// 		el.createEl('h4', { text: assistantFile.basename, cls: 'assistant-suggestion-header' });
// 		el.createEl('h6', { text: assistantFile.path, cls: 'assistant-suggestion-path' });
// 	}

// 	onChooseSuggestion(assistantFile: TFile, evt: MouseEvent | KeyboardEvent) {
// 		new AssistantFormModal(this.app, this.settings, assistantFile).open();
// 	}
// }