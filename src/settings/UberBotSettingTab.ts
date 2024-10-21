import { 	App, PluginSettingTab } from 'obsidian';
import { assistantSettings } from '@/src/settings/AssistantSettings';
import { chatHistorySettings } from '@/src/settings/ChatHistorySettings';
import { openAISettings } from '@/src/settings/OpenAISettings';
import { ollamaSettings } from '@/src/settings/OllamaSettings';
import UberBot from '@/main';

export class UberBotSettingTab extends PluginSettingTab {
	plugin: UberBot;

	constructor(app: App, plugin: UberBot) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h1', { text: 'Uber Bot Settings' });

		addHorizontalRule(containerEl);
		assistantSettings(containerEl, this.plugin, this);

		addHorizontalRule(containerEl);
		chatHistorySettings(containerEl, this.plugin, this);

		addHorizontalRule(containerEl);
		openAISettings(containerEl, this.plugin, this);

		addHorizontalRule(containerEl);
		ollamaSettings(containerEl, this.plugin, this);
	}
}

function addHorizontalRule(containerEl: HTMLElement) {
	const separator = document.createElement('hr');
	separator.style.margin = '1rem 0';
	containerEl.appendChild(separator);
}