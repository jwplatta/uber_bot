import {
  Setting, setIcon, SettingTab
} from 'obsidian';
import UberBot from '@/main';

export function chatHistorySettings(containerEl: HTMLElement, plugin: UberBot, settingTab: SettingTab) {
  const toggleSettingContainer = containerEl.createDiv({ cls: 'toggle-setting' });
  toggleSettingContainer.createEl('h2', {text: 'Chat History'});

	const initialState = plugin.settings.toggleChatHistorySettings;
  const chevronIcon = toggleSettingContainer.createEl('span', { cls: 'chevron-icon' });
  setIcon(chevronIcon, initialState ? 'chevron-down' : 'chevron-right');

	const settingsContainer = containerEl.createDiv();
	settingsContainer.style.display = initialState ? 'block' : 'none';

	toggleSettingContainer.addEventListener('click', async () => {
		const open = settingsContainer.style.display !== 'none';
		if (open) {
			setIcon(chevronIcon, 'chevron-right');
			settingsContainer.style.display = 'none';
			plugin.settings.toggleChatHistorySettings = false;
		} else {
			setIcon(chevronIcon, 'chevron-down');
			settingsContainer.style.display = 'block';
			plugin.settings.toggleChatHistorySettings = true;
		}
		await plugin.saveSettings();
	});

  new Setting(settingsContainer)
		.setName('Chat History Path')
		.setDesc('Folder where chats are stored.')
		.addText(text => {
			text
				.setPlaceholder('Path...')
				.setValue(plugin.settings.chatHistory.chatHistoryPath)
				.onChange(async(value) => {
					plugin.settings.chatHistory.chatHistoryPath = value;
					await plugin.saveSettings();
				})
        .then((cb) => {
          cb.inputEl.style.width = '100%';
        })
		});
}