import {
  App, WorkspaceLeaf,
  MarkdownView, Modal,
	Plugin,
	PluginSettingTab,
	SuggestModal,
	TFile
} from 'obsidian';
import { VIEW_TYPE_CHAT, ChatView } from "./src/chat/ChatView";
import { VIEW_TYPE_CHAT_HISTORY, ChatHistoryView } from "./src/chat_history/ChatHistoryView";
import { assistantSettings } from './src/settings/AssistantSettings';
import { chatHistorySettings } from './src/settings/ChatHistorySettings';
import { openAISettings } from './src/settings/OpenAISettings';

export interface NoteSecretarySettings {
	assistants: {
		assistant: string;
		assistantDefinitionsPath: string;
	},
	chatHistory: {
		chatHistoryPath: string;
	},
	openAI: {
		key: string;
	}
	toggleProfileSettings: boolean,
	toggleChatHistorySettings: boolean,
	toggleOpenAISettings: boolean
}

const DEFAULT_SETTINGS: NoteSecretarySettings = {
	assistants: {
		assistant: 'NoteSecretary/Assistants/DefaultAssistant.md',
		assistantDefinitionsPath: 'NoteSecretary/Assistants',
	},
	chatHistory: {
		chatHistoryPath: 'NoteSecretary/ChatHistory',
	},
	openAI: {
		key: ''
	},
	toggleProfileSettings: false,
	toggleChatHistorySettings: false,
	toggleOpenAISettings: false
}

export default class NoteSecretary extends Plugin {
	settings: NoteSecretarySettings;

	async onload() {
		await this.loadSettings();

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => {
				// const defaultAssistantFile = this.app.vault.getFileByPath(this.settings.assistants.assistant)
				return new ChatView(leaf, this.app, this.settings, null)
			}
    );

		this.registerView(
			VIEW_TYPE_CHAT_HISTORY,
			(leaf) => new ChatHistoryView(leaf, this.app, this.settings.chatHistory.chatHistoryPath)
		);

		this.app.vault.on('modify', (file) => {
			console.log('File modified: ', file.path);
		})

		const ribbonIconEl = this.addRibbonIcon('bot', 'NoteSecretary', (evt: MouseEvent) => {
      this.activateChatView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('note-secretary-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('note-secretary Status');

		this.addCommand({
			id: 'open-chat-history',
			name: 'Chat History',
			callback: () => {
				this.activateChatHistoryView();
			}
		})

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'select-assistant',
			name: 'Select Assistant',
			callback: () => {
				new SearchAssistantModal(this.app, this.settings, this).open();
			}
		});

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
						new ChatModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NoteSecretarySettingTab(this.app, this));

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

	async startNewChat(assistantFile: TFile) {
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
				state: { assistantFile: assistantFile }
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
				{ type: VIEW_TYPE_CHAT,
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

class SearchAssistantModal extends SuggestModal<TFile> {
	app: App;
	settings: NoteSecretarySettings;
	plugin: NoteSecretary;
	assistantFiles: TFile[];

	constructor(app: App, settings: NoteSecretarySettings, plugin: NoteSecretary) {
		super(app);
		this.app = app;
		this.settings = settings;
		this.plugin = plugin;

		const files = this.app.vault.getMarkdownFiles();
		this.assistantFiles = files.filter((file: TFile) => {
			return file.path.includes(this.settings.assistants.assistantDefinitionsPath);
		})
	}

	async getSuggestions(query: string): Promise<TFile[]> {
		const filteredAssistants = this.assistantFiles.filter((assistant) => {
			return assistant.basename.toLowerCase().includes(query.toLowerCase());
		});

		return filteredAssistants;
	}

	renderSuggestion(assistantFile: TFile, el: HTMLElement) {
		el.createEl('h4', { text: assistantFile.basename, cls: 'assistant-suggestion-header' });
		el.createEl('h6', { text: assistantFile.path, cls: 'assistant-suggestion-path' });
	}

	onChooseSuggestion(assistantFile: TFile, evt: MouseEvent | KeyboardEvent) {
		console.log(evt);
		console.log(assistantFile);
		// this.app.workspace.openLinkText(file_path, '');
		// TODO: start new chat with selected assistant
		this.plugin.startNewChat(assistantFile);
	}
}

class ChatModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class NoteSecretarySettingTab extends PluginSettingTab {
	plugin: NoteSecretary;

	constructor(app: App, plugin: NoteSecretary) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h1', { text: 'Note Secretary Settings' });

		addHorizontalRule(containerEl);
		assistantSettings(containerEl, this.plugin, this);

		addHorizontalRule(containerEl);
		chatHistorySettings(containerEl, this.plugin, this);

		addHorizontalRule(containerEl);
		openAISettings(containerEl, this.plugin, this);
	}
}

function addHorizontalRule(containerEl: HTMLElement) {
	const separator = document.createElement('hr');
	separator.style.margin = '1rem 0';
	containerEl.appendChild(separator);
}