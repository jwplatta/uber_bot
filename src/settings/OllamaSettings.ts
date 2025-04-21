import { Setting, setIcon, SettingTab } from "obsidian";
import UberBot from "@/main";
import { Ollama } from "ollama";

export async function ollamaSettings(
	containerEl: HTMLElement,
	plugin: UberBot,
	settingTab: SettingTab
) {
	const toggleSettingContainer = containerEl.createDiv({
		cls: "toggle-setting",
	});
	toggleSettingContainer.createEl("h2", { text: "Ollama" });

	const initialState = plugin.settings.toggleOllamaSettings;
	const chevronIcon = toggleSettingContainer.createEl("span", {
		cls: "chevron-icon",
	});
	setIcon(chevronIcon, initialState ? "chevron-down" : "chevron-right");

	const settingsContainer = containerEl.createDiv();
	settingsContainer.style.display = initialState ? "block" : "none";

	toggleSettingContainer.addEventListener("click", async () => {
		const open = settingsContainer.style.display !== "none";
		if (open) {
			setIcon(chevronIcon, "chevron-right");
			settingsContainer.style.display = "none";
			plugin.settings.toggleOllamaSettings = false;
		} else {
			setIcon(chevronIcon, "chevron-down");
			settingsContainer.style.display = "block";
			plugin.settings.toggleOllamaSettings = true;
		}
		await plugin.saveSettings();
	});

	const ollamaHost = plugin.settings.ollama.host;
	let ollamaModels = <any>[];

	try {
		const ollama = new Ollama({ host: ollamaHost });
		ollamaModels = await ollama.list();
		ollamaModels = ollamaModels.models;
	} catch (error) {
		console.error(error);
	}

	new Setting(settingsContainer).setName("Model").addDropdown((select) => {
		console.log("ollamaModel: ", ollamaModels, ollamaModels.length);
		if (ollamaModels.length > 0) {
			ollamaModels.forEach((model: any) => {
				select.addOption(model.name, model.name);
			});
			select.setValue(
				plugin.settings.ollama.model || ollamaModels[0].name
			);
			select.onChange(async (value: string) => {
				plugin.settings.ollama.model = value;
				await plugin.saveSettings();
			});
		} else {
			select.addOption("", "No models available");
			select.setDisabled(true);
		}
	});

	new Setting(settingsContainer).setName("Host").addText((text) => {
		text.setPlaceholder("http://localhost:8000")
			.setValue(plugin.settings.ollama.host)
			.onChange(async (value) => {
				plugin.settings.ollama.host = value;
				await plugin.saveSettings();
			})
			.then((cb) => {
				cb.inputEl.style.width = "100%";
			});
	});

	new Setting(settingsContainer)
		.setName("Stream")
		.setDesc("Enable streaming completions")
		.addToggle((toggle) => {
			toggle
				.setValue(plugin.settings.ollama.stream)
				.onChange(async (value) => {
					plugin.settings.ollama.stream = value;
					await plugin.saveSettings();
				});
		});
}
