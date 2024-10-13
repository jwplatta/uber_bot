import { Modal, App, TFile } from 'obsidian';
import { UberBotSettings } from '@/src/settings/UberBotSettings';
import { OpenAIModels, OllamaModels } from '@/src/settings/llmModels';

export default class AssistantFormModal extends Modal {
	constructor(app: App, settings: UberBotSettings, assistantFile: TFile | null) {
		super(app);

		if (assistantFile) {
			this.setTitle('Edit Assistant');
		} else {
			this.setTitle('Create Assistant');
		}

		this.modalEl.addClass('assistant-form-modal');

		this.contentEl.createEl('p', { text: 'Assistant Name' });
		const nameInput = this.contentEl.createEl('input', { cls: 'input-text' });

		this.contentEl.createEl('p', { text: 'System Prompt' });
		const systemPromptTextarea = this.contentEl.createEl('textarea', { cls: 'input-text' });

		this.contentEl.createEl('p', { text: 'Model' });
		const modelDropdown = this.contentEl.createEl('select', { cls: 'model-dropdown' });
		const models = OpenAIModels.concat(OllamaModels);
		models.forEach((model: string) => {
			const option = modelDropdown.createEl('option', { text: model });
			option.value = model;
		});

		this.contentEl.createEl('p', { text: 'Enable Streaming' });
		const streamingToggle = this.contentEl.createEl('input', {
			type: 'checkbox'
		});

		// NOTE: Temperature
		this.contentEl.createEl('p', { text: 'Temperature' });
		const tempSlider = this.contentEl.createEl('input', { type: 'range', attr: { min: '0', max: '1', step: '0.01' } });
		tempSlider.style.width = '50%';
		tempSlider.value = "0.0";

		const tempValueLabel = this.contentEl.createEl('p', { text: "0.0" });
		tempSlider.addEventListener('input', () => {
			tempValueLabel.textContent = tempSlider.value;
		});

		// NOTE: Max Tokens
		this.contentEl.createEl('p', { text: 'Max Tokens' });
		const maxTokensSlider = this.contentEl.createEl('input', { type: 'range', attr: { min: '1', max: '4095', step: '1' } });
		maxTokensSlider.style.width = '50%';
		maxTokensSlider.value = "512";

		const maxTokensValueLabel = this.contentEl.createEl('p', { text: "512" });
		maxTokensSlider.addEventListener('input', () => {
			maxTokensValueLabel.textContent = maxTokensSlider.value;
		});

		// NOTE: Top P
		this.contentEl.createEl('p', { text: 'Top P' });
		const topPSlider = this.contentEl.createEl('input', { type: 'range', attr: { min: '0', max: '1', step: '0.01' } });
		topPSlider.style.width = '50%';
		topPSlider.value = "1.0";

		const topPValueLabel = this.contentEl.createEl('p', { text: "1.0" });
		topPSlider.addEventListener('input', () => {
			topPValueLabel.textContent = topPSlider.value;
		});

		// NOTE: Frequency Penalty
		this.contentEl.createEl('p', { text: 'Frequency Penalty' });
		const frequencyPenaltySlider = this.contentEl.createEl('input', { type: 'range', attr: { min: '0', max: '2', step: '0.01' } });
		frequencyPenaltySlider.style.width = '50%';
		frequencyPenaltySlider.value = "0.0";

		const frequencyPenaltyValueLabel = this.contentEl.createEl('p', { text: "0.0" });
		frequencyPenaltySlider.addEventListener('input', () => {
			frequencyPenaltyValueLabel.textContent = frequencyPenaltySlider.value;
		});

		// NOTE: Presence Penalty
		this.contentEl.createEl('p', { text: 'Presence Penalty' });
		const presencePenaltySlider = this.contentEl.createEl('input', { type: 'range', attr: { min: '0', max: '2', step: '0.01' } });
		presencePenaltySlider.style.width = '50%';
		presencePenaltySlider.value = "0.0";

		const presencePenaltyValueLabel = this.contentEl.createEl('p', { text: "0.0" });
		presencePenaltySlider.addEventListener('input', () => {
			presencePenaltyValueLabel.textContent = presencePenaltySlider.value;
		});

		const saveButton = this.contentEl.createEl('button', { text: 'Save', cls: 'save-button', attr: { type: 'button' } });

		saveButton.addEventListener('click', () => {
			const content = `---\nname: ${nameInput.value}\nmodel: ${modelDropdown.value}\ntemperature: ${tempSlider.value}\nmax-tokens: ${maxTokensSlider.value}\ntop-p: ${topPSlider.value}\nfrequency-penalty: ${frequencyPenaltySlider.value}\npresence-penalty: ${presencePenaltySlider.value}\nstream: ${streamingToggle.checked}\n---\n${systemPromptTextarea.value}`;

			if(assistantFile) {
				this.app.vault.modify(
					assistantFile,
					content
				).catch(() => {
					console.log("Unable to save assistant")
				});
			} else {
				this.app.vault.create(
					`${settings.assistants.assistantDefinitionsPath}/${nameInput.value}.md`,
					content
				).catch(() => {
					console.log("Unable to create assistant")
				});
			}

			this.close();
		});

		// NOTE: set defaults if passed an existing assistant
		if (assistantFile) {
			this.app.vault.read(assistantFile).then((content) => {
				const fileCache = this.app.metadataCache.getFileCache(assistantFile);
				if (!fileCache || fileCache === null || fileCache === undefined) {
					console.log('No frontmatter found for assistant file');
					return;
				}

				console.log(fileCache.frontmatter);

				const frontmatterEndPos = fileCache.frontmatterPosition?.end.line || 0;
				const lines = content.split('\n');
				const systemPrompt = lines.slice(frontmatterEndPos+1).join('\n');

				nameInput.value = fileCache.frontmatter?.name || "";
				modelDropdown.value = fileCache.frontmatter?.model || "";
				streamingToggle.checked = fileCache.frontmatter?.stream || "";

				tempSlider.value = fileCache.frontmatter?.temperature || 0;
				tempValueLabel.textContent = tempSlider.value

				maxTokensSlider.value = fileCache.frontmatter?.['max-tokens'] || 512;
				maxTokensValueLabel.textContent = maxTokensSlider.value

				topPSlider.value = fileCache.frontmatter?.['top-p'] || 1;
				topPValueLabel.textContent = topPSlider.value

				frequencyPenaltySlider.value = fileCache.frontmatter?.['frequency-penalty'] || 0.0;
				frequencyPenaltyValueLabel.textContent = frequencyPenaltySlider.value

				presencePenaltySlider.value = fileCache.frontmatter?.['presence-penalty'] || 0.0;
				presencePenaltyValueLabel.textContent = presencePenaltySlider.value

				systemPromptTextarea.value = systemPrompt;
			});
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}