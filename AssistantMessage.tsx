import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FilePlus } from 'lucide-react';
import { App } from 'obsidian';

interface AssistantMessageProps {
  app: App;
  role: string;
  content: string;
}

export const AssistantMessage: FC<AssistantMessageProps> = ({ app, role, content }) => {
  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
      }).catch((err) => {
        console.error("Failed to copy: ", err);
      });
    }
  };

  const createNewNote = () => {
    const defaultNewFileLocation = (app.vault as any).getConfig('newFileLocation');
    const title = `ChatNote-${Date.now()}.md`;
    let path = "";

    if (defaultNewFileLocation === 'root') {
      path = "/" + title;
    } else if (defaultNewFileLocation === 'current') {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        path = "/" + title;
      } else {
        path = (activeFile.path || "/") + title;
      }
    } else {
      const dir = (app.vault as any).getConfig('newFileFolderPath') + "/"
      path = dir + title;
    }

    app.vault.create(path, content);
  }

  return (
    <div className="chat-assistant-message">
      <ReactMarkdown>{content || ""}</ReactMarkdown>
      <div className="chat-assistant-controls">
        <div className="chat-assistant-control tool-tip" data-tooltip="Copy to clipboard" onClick={copyToClipboard}>
          <Copy size={20} />
        </div>
        <div className="chat-assistant-control tool-tip" data-tooltip="Create a new note" onClick={createNewNote}>
          <FilePlus size={20} />
        </div>
      </div>
    </div>
  )
}