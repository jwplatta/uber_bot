import { App, TFile, SuggestModal } from 'obsidian';
import UberBot from '@/main'
import { UberBotSettings } from '@/src/settings/UberBotSettings';

export default class SearchAssistantModal extends SuggestModal<TFile> {
	app: App;
	settings: UberBotSettings;
	plugin: UberBot;
	chatWithNote: boolean;
	assistantFiles: TFile[];

	constructor(app: App, settings: UberBotSettings, plugin: UberBot, chatWithNote = false) {
		super(app);
		this.app = app;
		this.settings = settings;
		this.plugin = plugin;
		this.chatWithNote = chatWithNote;

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
		if (this.chatWithNote) {
			const activeFile = this.app.workspace.getActiveFile();
			this.plugin.startNewChat(assistantFile, activeFile);
		} else {
			this.plugin.startNewChat(assistantFile, null);
		}
	}
}