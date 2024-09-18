import {
  Setting, setIcon, SettingTab
} from 'obsidian';
import NoteSecretary from '../../main';

export function assistantSettings(containerEl: HTMLElement, plugin: NoteSecretary, settingTab: SettingTab) {
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
		.setName('Assistant Path')
		.setDesc('Folder where assistant definitions are stored.')
		.addText(text => text);

	new Setting(settingsContainer)
		.setName('Assistant')
		.setDesc('Select a default assistant.')
		.addDropdown(dropdown => {
			dropdown.addOption('Assistant 1', 'assistant1');
			dropdown.addOption('Assistant 2', 'assistant2');
			dropdown.addOption('Assistant 3', 'assistant3');
		});
}