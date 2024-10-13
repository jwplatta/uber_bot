import {
  Setting, setIcon, SettingTab
} from 'obsidian';
import UberBot from '@/main';

export function openAISettings(containerEl: HTMLElement, plugin: UberBot, settingTab: SettingTab) {
  const toggleSettingContainer = containerEl.createDiv({ cls: 'toggle-setting' });
  toggleSettingContainer.createEl('h2', {text: 'OpenAI'});

	const initialState = plugin.settings.toggleOpenAISettings;
  const chevronIcon = toggleSettingContainer.createEl('span', { cls: 'chevron-icon' });
  setIcon(chevronIcon, initialState ? 'chevron-down' : 'chevron-right');

	const settingsContainer = containerEl.createDiv();
	settingsContainer.style.display = initialState ? 'block' : 'none';

	toggleSettingContainer.addEventListener('click', async () => {
		const open = settingsContainer.style.display !== 'none';
		if (open) {
			setIcon(chevronIcon, 'chevron-right');
			settingsContainer.style.display = 'none';
			plugin.settings.toggleOpenAISettings = false;
		} else {
			setIcon(chevronIcon, 'chevron-down');
			settingsContainer.style.display = 'block';
			plugin.settings.toggleOpenAISettings = true;
		}
		await plugin.saveSettings();
	});

	new Setting(settingsContainer)
		.setName('OpenAI Key')
		.addText(text => {
			text
				.setPlaceholder('API Key')
				.setValue(plugin.settings.openAI.key)
				.onChange(async(value) => {
					plugin.settings.openAI.key = value;
					await plugin.saveSettings();
				})
        .then((cb) => {
          cb.inputEl.style.width = '100%';
        })
		});

  new Setting(settingsContainer)
		.setName('Model')
		.addDropdown((select) => {
			select
				.addOption('gpt-4o-mini', 'gpt-4o-mini')
				.addOption('gpt-4o', 'gpt-4o')
				.setValue(plugin.settings.openAI.model)
				.onChange(async (value: string) => {
					plugin.settings.openAI.model = value;
					await plugin.saveSettings();
				});
		});

  new Setting(settingsContainer)
	.setName('Stream')
	.setDesc('Enable streaming completions')
	.addToggle((toggle) => {
		toggle
			.setValue(plugin.settings.openAI.stream)
			.onChange(async (value) => {
				plugin.settings.openAI.stream = value;
				await plugin.saveSettings();
			});
	});
}