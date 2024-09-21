import { App, getFrontMatterInfo, TFile } from 'obsidian';
import { FC, useEffect, useState } from 'react';

interface ChatHistoryComponentProps {
  app: App;
  chatHistoryPath: string;
}

interface ChatFile {
  basename: string;
  path: string;
  keywords: string[];
  created: string;
}

export const ChatHistoryComponent: FC<ChatHistoryComponentProps> = ({ app, chatHistoryPath }) => {
  const [ chatHistoryFiles, setChatHistoryFiles ] = useState<ChatFile[]>([]);
  useEffect(() => {
    const getFiles = async () => {
      const files = app.vault.getFiles();

      const filteredFiles = files.filter((file) => file.path.includes(chatHistoryPath));

      const chatFiles = filteredFiles.map(async (file) => {
        const contents = await app.vault.read(file);
        const fmInfo = await getFrontMatterInfo(contents);
        const frontMatterAttrs = fmInfo.frontmatter.split('\n');
        const chatF: ChatFile = {
          basename: file.basename,
          path: file.path,
          keywords: [],
          created: ''
        }
        frontMatterAttrs.forEach((attr: string) => {
          const [keyName, value] = attr.split(': ');

          if (keyName === 'keywords') {
            chatF.keywords = value.split(',');
          }

          if(keyName === 'created') {
            chatF.created = value;
          }
        });

        // console.log("fmInfo: ", fmInfo.frontmatter.split('\n'));
        return chatF;
      });

      const resolvedChatFiles = await Promise.all(chatFiles);
      console.log("filteredFiles: ", resolvedChatFiles);
      setChatHistoryFiles(resolvedChatFiles);
    }

    getFiles();

  }, []);

  // const handleFileLinkClick = (filePath: string) => {
  //   app.workspace.openLinkText(filePath, '');
  // };


  return (
    <div className="chat-history-container">
    <table className="chat-history-table">
      <thead>
        <tr>
          <th>Chat</th>
          <th>Keywords</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {chatHistoryFiles.map((file: ChatFile, index: number) => (
          <tr key={index} className={index % 2 === 0 ? "chat-history-row-light" : "chat-history-row-dark"}>
            <td className="chat-history-cell">
              <a href="#" onClick={() => app.workspace.openLinkText(file.path, '')}>{file.basename}</a>
            </td>
            <td className="chat-history-cell">
              {file.keywords}
            </td>
            <td className="chat-history-cell">
              {file.created}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}