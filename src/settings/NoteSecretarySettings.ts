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
		model: string;
		stream: boolean;
	},
	ollama: {
		host: string;
		model: string;
		models: string[];
		stream: boolean;
	},
	toggleProfileSettings: boolean,
	toggleChatHistorySettings: boolean,
	toggleOpenAISettings: boolean,
	toggleOllamaSettings: boolean
}

export const DEFAULT_SETTINGS: NoteSecretarySettings = {
	assistants: {
		assistant: 'NoteSecretary/Assistants/DefaultAssistant.md',
		assistantDefinitionsPath: 'NoteSecretary/Assistants',
	},
	chatHistory: {
		chatHistoryPath: 'NoteSecretary/ChatHistory',
	},
	openAI: {
		key: '',
		model: 'gpt-4o-mini',
		stream: true
	},
	ollama: {
		host: 'http://localhost:11434',
		model: 'llama3.2:latest',
		models: [],
		stream: true
	},
	toggleProfileSettings: false,
	toggleChatHistorySettings: false,
	toggleOpenAISettings: false,
	toggleOllamaSettings: false
}