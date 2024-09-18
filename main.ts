import {
  App, WorkspaceLeaf,
  MarkdownView, Modal,
  Notice, Plugin,
	PluginSettingTab,
  Setting, setIcon
} from 'obsidian';
export const VIEW_TYPE_CHAT = "chat-view";
import { ChatView } from "./ChatView";
import { assistantSettings } from './src/settings/AssistantSettings';


interface NoteSecretarySettings {
	assistants: {
		assistant: string;
		assistantDefinitionsPath: string;
	},
	chatHistory: {
		chatHistoryPath: string;
	},
	toggleProfileSettings: boolean,
	toggleChatHistorySettings: boolean
}

const DEFAULT_SETTINGS: NoteSecretarySettings = {
	assistants: {
		assistant: 'assistant.md',
		assistantDefinitionsPath: 'NoteSecretary/Assistants',
	},
	chatHistory: {
		chatHistoryPath: 'NoteSecretary/ChatHistory',
	},
	toggleProfileSettings: false,
	toggleChatHistorySettings: false,
}

export default class NoteSecretary extends Plugin {
	settings: NoteSecretarySettings;

	async onload() {
		await this.loadSettings();

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => new ChatView(leaf, this.app)
    );

		this.app.vault.on('modify', (file) => {
			console.log('File modified: ', file.path);
		})

		const ribbonIconEl = this.addRibbonIcon('bot', 'NoteSecretary', (evt: MouseEvent) => {
      this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('note-secretary-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('note-secretary Status');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-note-secretary-chat',
			name: 'Chat',
			callback: () => {
				new ChatModal(this.app).open();
			}
		});

		this.addCommand({
			id: 'index-notes',
			name: 'Index Notes',
			// editorCallback: (editor: Editor, view: MarkdownView) => {
			// 	console.log(editor.getSelection());
			// 	editor.replaceSelection('Sample Editor Command');
			// }
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

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      // leaf = workspace.getLeaf(false);
			leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_CHAT, active: true });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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

		// NOTE: Settings Header
		containerEl.createEl('h1', { text: 'Note Secretary Settings' });
		addHorizontalRule(containerEl);

		assistantSettings(containerEl, this.plugin, this);
	}
}

function addHorizontalRule(containerEl: HTMLElement) {
	const separator = document.createElement('hr');
	separator.style.margin = '1rem 0';
	containerEl.appendChild(separator);
}