import { FC, KeyboardEvent, useRef, useEffect, useState } from 'react';
import { SquarePen, ArrowUp } from 'lucide-react';
import { App, TFile } from 'obsidian';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { AssistantMessage } from './AssistantMessage';
import { NoteSecretarySettings } from './main'

interface ChatComponentProps {
  app: App;
  settings: NoteSecretarySettings;
  assistantFile: TFile | null;
}

interface Message {
  role: string;
  content: string;
}

export const ChatComponent: FC<ChatComponentProps> = ({ app, settings, assistantFile }) => {
  const [chatHistoryFile, setChatHistoryFile] = useState<TFile|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null as any);
  const [showInput, setShowInput] = useState(true);
  const [systemText, setSystemText] = useState("");
  const openai = new OpenAI({
    apiKey: settings.openAI.key,
    dangerouslyAllowBrowser: true
  });

  const startNewChatHistory = async () => {
    const historyFrontmatter = `---\nassistant: ${assistantFile?.path}\nkeywords: \ncreated: ${new Date().toLocaleString()}\n---\n`;
    const title = `${assistantFile?.basename}-${Date.now()}.md`;
    const chatHistFile = await app.vault.create(
      settings.chatHistory.chatHistoryPath + "/" + title,
      historyFrontmatter
    );
    setChatHistoryFile(chatHistFile);
  }

  useEffect(() => {
    const startChatHistory = async () => {
      if (!chatHistoryFile) {
        await startNewChatHistory();
        // const historyFrontmatter = `---\nassistant: ${assistantFile?.path}\ncreated: ${new Date().toLocaleString()}\n---\n`;
        // const title = `${assistantFile?.basename}-${Date.now()}.md`;
        // const chatHistFile = await app.vault.create(
        //   settings.chatHistory.chatHistoryPath + "/" + title,
        //   historyFrontmatter
        // );

        // console.log("chatHistoryFile: ", chatHistFile);
        // setChatHistoryFile(chatHistFile);
        // const chatHistoryText = await app.vault.read(chatHistoryFile);
        // const chatHistory = chatHistoryText.split('\n');
        // setChatHistoryPath(chatHistory);
      }
    }
    const readAssistantFile = async () => {
      console.log(assistantFile);

      if (assistantFile) {
        const fileMetadata = app.metadataCache.getFileCache(assistantFile)
        console.log(fileMetadata?.frontmatter)

        const assistantFileText = await app.vault.read(assistantFile);

        if(fileMetadata && fileMetadata.frontmatterPosition?.end.line !== undefined) {
          const sysText = assistantFileText.split('\n').slice(
            fileMetadata.frontmatterPosition?.end.line + 1
          ).join('\n')

          console.log("assistantFile TEXT:\n", sysText)
          setSystemText(sysText)
        }
      }
    }

    readAssistantFile();
    startChatHistory();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset the height first
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // Adjust to content
    }

    scrollToBottom();
  }, [messages, input]);

  const scrollToBottom = () => {
    console.log(messages);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    setShowInput(false);

    if (input.trim()) {
      let messagesContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemText
        }
      ]
      messagesContext = messagesContext.concat(messages as OpenAI.Chat.ChatCompletionMessageParam[]);

      const newMessage: OpenAI.Chat.ChatCompletionMessageParam = {
        role: 'user',
        content: input,
      };
      if (chatHistoryFile) {
        app.vault.append(chatHistoryFile, `${newMessage.role}: ${newMessage.content}\n***\n`);
      }

      messagesContext.push(newMessage);

      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: messagesContext,
        model: "gpt-4o-mini", //TODO: move to settings
        stream: true
      };

      setMessages([...messages, newMessage as Message]);

      try {
        const completion = await openai.chat.completions.create(params);
        const assistantMessage: Message = {
          role: 'assistant',
          content: '',
        };

        for await (const chunk of completion) {
          const contentChunk = chunk.choices[0].delta?.content || '';
          assistantMessage.content += contentChunk;

          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];

            if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
              updatedMessages[updatedMessages.length - 1] = assistantMessage;
            } else {
              updatedMessages.push(assistantMessage);
            }
            return updatedMessages;
          });

          scrollToBottom();
        }
        if (chatHistoryFile) {
          app.vault.append(chatHistoryFile, `${assistantMessage.role}: ${assistantMessage.content}\n***\n`);
        }
      } catch (error) {
        console.error('Error streaming response:', error);
      }

      setInput('');
      setShowInput(true);
    }
  };

  // TODO:
  // const handleFileLinkClick = (filePath: string) => {
  //   app.workspace.openLinkText(filePath, '');
  // };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // #noop;
    } else if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        handleSendMessage();
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleNewChatButtonClick = async () => {
    await startNewChatHistory();
    setMessages([]);
    console.log("New chat button clicked");
  }

  return (
    <div className="chat-container">
      <div className="chat-header flex justify-between items-center">
        <div className="new-chat-button tool-tip" onClick={handleNewChatButtonClick} data-tooltip="Start a new chat">
          <SquarePen size={24} />
        </div>
        <h1>
          {assistantFile?.basename || ""}
        </h1>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          message.role === 'assistant' ? (
            <AssistantMessage key={index} app={app} role={message.role} content={message.content} />
          ) : (
          <div key={index} className="chat-user-message">
            <ReactMarkdown>{message.content || ""}</ReactMarkdown>
          </div>
        )))}
        <div ref={messagesEndRef} />
      </div>
      {showInput && <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
        />
        <ArrowUp size={36} className="chat-input-button" onClick={handleSendMessage} />
      </div>}
    </div>
  );
};