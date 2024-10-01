import { FC, KeyboardEvent, useRef, useEffect, useState } from 'react';
import { SquarePen, ArrowUp } from 'lucide-react';
import { App, TFile, MarkdownRenderer, ItemView } from 'obsidian';
import OpenAI from 'openai';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { NoteSecretarySettings } from '../../main'

interface ChatComponentProps {
  app: App;
  settings: NoteSecretarySettings;
  assistantFile: TFile | null;
  noteContextFile: TFile | null;
  chatView: ItemView
}

interface Message {
  role: string;
  content: string;
}

export const ChatComponent: FC<ChatComponentProps> = ({ app, settings, assistantFile, noteContextFile, chatView }) => {
  const [chatHistoryFile, setChatHistoryFile] = useState<TFile|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null as any);
  const [showInput, setShowInput] = useState(true);
  const [systemText, setSystemText] = useState("");
  const [noteContext, setNoteContext] = useState("");
  const [noteContextPath, setNoteContextPath] = useState("");
  const openai = new OpenAI({
    apiKey: settings.openAI.key,
    dangerouslyAllowBrowser: true
  });

  // const containerRef = useRef<HTMLDivElement>(null);

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
    // if (containerRef.current) {
    //   // Clear any existing content in the container
    //   containerRef.current.innerHTML = '';
    //   const markdownContent = "```dataview\nlist from \"philosophy\" sort file.name asc\n```";

    //   // Render markdown using Obsidian's MarkdownRenderer
    //   MarkdownRenderer.render(
    //     app,
    //     markdownContent,
    //     containerRef.current,
    //     '/',
    //     chatView
    //   );
    // }

    const startChatHistory = async () => {
      if (!chatHistoryFile) {
        await startNewChatHistory();
      }
    }

    const readAssistantFile = async () => {
      console.log("USING ASSISTANT: ", assistantFile);

      if (assistantFile) {
        const fileMetadata = app.metadataCache.getFileCache(assistantFile)
        // console.log(fileMetadata?.frontmatter)
        const assistantFileText = await app.vault.read(assistantFile);

        if(fileMetadata && fileMetadata.frontmatterPosition?.end.line !== undefined) {
          const sysText = assistantFileText.split('\n').slice(
            fileMetadata.frontmatterPosition?.end.line + 1
          ).join('\n')
          // console.log("assistantFile TEXT:\n", sysText)
          setSystemText(sysText)
        }
      }
    }

    const readNoteContext = async () => {
      if (noteContextFile) {
        const context = await app.vault.read(noteContextFile);
        setNoteContext(context);
        setNoteContextPath(noteContextFile.path);
      } else {
        setNoteContext("");
        setNoteContextPath("");
      }
    }

    readAssistantFile();
    readNoteContext();
    startChatHistory();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset the height first
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // Adjust to content
    }

    scrollToBottom();
  }, [messages, input]);

  const scrollToBottom = () => {
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
          content: noteContext === "" ? systemText : systemText + "\n###\nCONTEXT:\n" + noteContext
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
        model: settings.openAI.model,
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

  const renameChatHistoryFile = async () => {
    if (!chatHistoryFile || !chatHistoryFile.parent) {
      return;
    }

    const chatHistoryFilePath = chatHistoryFile.parent.path || "";
    const chatText = await app.vault.read(chatHistoryFile);

    const titlePrompt = `Write the topic of the TEXT in 3-5 words with no special characters.\n###\nTEXT:\n${chatText}`;
    const titleCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: titlePrompt }],
      model: settings.openAI.model
    });

    const keywordsPrompt = `Write 1 to 3 keywords or expressions that describe the TEXT. Each keyword should start with a hashtag and contain no spaces. The keywords should be comma separated. For example, "#philosophy, #free-will". \n###\nTEXT:\n${chatText}`;
    keywordsCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: keywordsPrompt }],
      model: settings.openAI.model
    });

    // const fileCache = app.metadataCache.getFileCache(file);
    // const frontmatter = fileCache?.frontmatter;

    await app.vault.copy(
      chatHistoryFile,
      chatHistoryFilePath + "/" + titleCompletion.choices[0].message.content + ".md"
    );
    await app.vault.delete(chatHistoryFile);
  }

  const handleNewChatButtonClick = async () => {
    await renameChatHistoryFile();
    await startNewChatHistory();
    setMessages([]);
  }

  return (
    <div className="chat-container">
      <div className="chat-header flex">
        <div className="new-chat-button tool-tip" onClick={handleNewChatButtonClick} data-tooltip="Start a new chat">
          <SquarePen size={24} />
        </div>
        <h1>
          {assistantFile?.basename || ""}
        </h1>
      </div>
      {noteContextPath !== "" && <h6 className="">Loaded "{noteContextPath}" as context.</h6>}
      <div className="chat-messages">
        {messages.map((message, index) => (
          message.role === 'assistant' ? (
            <AssistantMessage key={index} app={app} role={message.role} content={message.content} chatView={chatView} />
          ) : (
            <UserMessage key={index} content={message.content} />
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