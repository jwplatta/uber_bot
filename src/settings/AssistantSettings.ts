import {
  Setting, setIcon, SettingTab
} from 'obsidian';
import UberBot from '@/main';

export function assistantSettings(containerEl: HTMLElement, plugin: UberBot, settingTab: SettingTab) {
  const toggleSettingContainer = containerEl.createDiv({ cls: 'toggle-setting' });
  toggleSettingContainer.createEl('h2', {text: 'Assistants'});

	const initialState = plugin.settings.toggleProfileSettings;
  const chevronIcon = toggleSettingContainer.createEl('span', { cls: 'chevron-icon' });
  setIcon(chevronIcon, initialState ? 'chevron-down' : 'chevron-right');

	const settingsContainer = containerEl.createDiv();
	settingsContainer.style.display = initialState ? 'block' : 'none';

	toggleSettingContainer.addEventListener('click', async () => {
		const open = settingsContainer.style.display !== 'none';
		if (open) {
			setIcon(chevronIcon, 'chevron-right');
			settingsContainer.style.display = 'none';
			plugin.settings.toggleProfileSettings = false;
		} else {
			setIcon(chevronIcon, 'chevron-down');
			settingsContainer.style.display = 'block';
			plugin.settings.toggleProfileSettings = true;
		}
		await plugin.saveSettings();
	});

	new Setting(settingsContainer)
		.setName('Assistants Path')
		.setDesc('Folder where assistant definitions are stored.')
		.addText(text => {
			text
				.setPlaceholder(plugin.settings.assistants.assistantDefinitionsPath)
				.setValue(plugin.settings.assistants.assistantDefinitionsPath)
				.onChange(async(value) => {
					plugin.settings.assistants.assistantDefinitionsPath = value;
					await plugin.saveSettings();
				})
				.then((cb) => {
          cb.inputEl.style.width = '100%';
        })
		});

	new Setting(settingsContainer)
		.setName('Assistant')
		.setDesc('Select a default assistant.')
		.addDropdown((dropdown) => {
			const assistantFiles = plugin.app.vault.getFolderByPath(
				plugin.settings.assistants.assistantDefinitionsPath
			)?.children

			if (assistantFiles) {
				assistantFiles.forEach(file => {
					console.log("assistant path: ", file)
					dropdown.addOption(file.path, file.name);
				})
			}

			dropdown.onChange(async (value) => {
				plugin.settings.assistants.assistant = value;
        await plugin.saveSettings();
			})
		});
}