import { FC, useRef, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';
import { Copy, FilePlus } from 'lucide-react';
import { App, ItemView, MarkdownRenderer } from 'obsidian';

interface AssistantMessageProps {
  app: App;
  role: string;
  content: string;
  chatView: ItemView;
}

export const AssistantMessage: FC<AssistantMessageProps> = ({ app, role, content, chatView }) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.innerHTML = '';
      MarkdownRenderer.render(
        app,
        content,
        messageContainerRef.current,
        app.vault.getRoot().path,
        chatView
      );
    }
  }, [content, chatView]);

  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        // noop
      }).catch((err) => {
        console.error("Failed to copy: ", err);
      });
    }
  };

  // const renderMessage = () => {
  //   return htmlToMarkdown(
  //     "<div>" + content + "</div>",
  //   )
  // }

  const createNewNote = async () => {
    const defaultNewFileLocation = (app.vault as any).getConfig('newFileLocation');
    const title = `ChatNote-${Date.now()}.md`;
    let path = "";

    if (defaultNewFileLocation === 'root') {
      path = title;
    } else if (defaultNewFileLocation === 'current') {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        path = title;
      } else {
        path = (activeFile.path || "/") + title;
      }
    } else {
      const dir = (app.vault as any).getConfig('newFileFolderPath') + "/"
      path = dir + title;
    }
    await app.vault.create(path, content);
    const f = await app.vault.getFileByPath(path);

    if (f) {
      const leaf = app.workspace.getLeaf();
      await leaf.openFile(f);
    }
  }

  return (
    <div className="chat-assistant-message">
      <div ref={messageContainerRef} />
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