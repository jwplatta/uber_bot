import OpenAI from 'openai';
import { App, TFile } from "obsidian";
import { NoteSecretarySettings } from '@/src/settings/NoteSecretarySettings';

export const createChatHistoryFile = async (file: TFile, app: App, settings: NoteSecretarySettings) => {
  const historyFrontmatter = `---\nassistant: ${file?.path}\ncreated: ${new Date().toLocaleString()}\n---\n`;
  const title = `${file?.basename}-${Date.now()}.md`;
  const chatHistFile = await app.vault.create(
    settings.chatHistory.chatHistoryPath + "/" + title,
    historyFrontmatter
  );
  return chatHistFile;
}

export const renameChatHistoryFile = async (chatHistoryFile: TFile, app: App, settings: NoteSecretarySettings) => {
  if (!chatHistoryFile.parent) {
    return;
  }

  const openai = new OpenAI({
    apiKey: settings.openAI.key,
    dangerouslyAllowBrowser: true
  });

  const chatHistoryFilePath = chatHistoryFile.parent.path || "";
  const chatText = await app.vault.read(chatHistoryFile);

  const titlePrompt = `Write the topic of the TEXT in 3-5 words with no special characters.\n###\nTEXT:\n${chatText}`;
  const titleCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: titlePrompt }],
    model: settings.openAI.model
  });

  const keywordsPrompt = `Write 1 to 3 keywords or expressions that describe the TEXT. Each keyword should start with a hashtag, contain no spaces, and be all lowercase. The keywords should be comma separated. For example, "#philosophy, #free-will". \n###\nTEXT:\n${chatText}`;
  const keywordsCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: keywordsPrompt }],
    model: settings.openAI.model
  });

  await app.fileManager.processFrontMatter(chatHistoryFile, (frontmatter) => {
    frontmatter['tags'] = keywordsCompletion.choices[0].message.content;
  });

  await app.vault.copy(
    chatHistoryFile,
    chatHistoryFilePath + "/" + titleCompletion.choices[0].message.content + ".md"
  );
  await app.vault.delete(chatHistoryFile);
}
