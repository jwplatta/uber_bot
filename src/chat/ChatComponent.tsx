import { FC, KeyboardEvent, useRef, useEffect, useState } from 'react';
import { SquarePen, ArrowUp } from 'lucide-react';
import {
  App, TFile,
  // MarkdownRenderer,
  ItemView } from 'obsidian';
import { AssistantMessage } from '@/src/chat/AssistantMessage';
import { UserMessage } from '@/src/chat/UserMessage';
import { UberBotSettings } from '@/src/settings/UberBotSettings';
import { createChatHistoryFile, renameChatHistoryFile } from '@/src/chat/util';
import { buildAssistant } from '@/src/assistants/buildAssistant';
import { Assistant } from '@/src/assistants/types';

interface ChatComponentProps {
  app: App;
  settings: UberBotSettings;
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
  const [noteContext, setNoteContext] = useState("");
  const [noteContextPath, setNoteContextPath] = useState("");
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  // const containerRef = useRef<HTMLDivElement>(null);

  const startChatHistory = async () => {
    if (!chatHistoryFile) {
      const chatHistFile = await createChatHistoryFile(
        assistantFile as TFile,
        app,
        settings
      );
      setChatHistoryFile(chatHistFile);
    }
  }

  const loadAssistant = async () => {
    if(!assistant && assistantFile) {
      const asst = await buildAssistant(app, assistantFile as TFile, settings);
      console.log("LOADED ASSISTANT: ", asst);
      setAssistant(asst);
    }
  }

  const resetAssistant = async () => {
    if (assistantFile) {
      const asst = await buildAssistant(app, assistantFile as TFile, settings);
      console.log("LOADED ASSISTANT: ", asst);
      setAssistant(asst);
    }
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

    loadAssistant();
    readNoteContext();
    startChatHistory();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }

    if(showInput) {
      textareaRef.current.focus();
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

    if (!assistant) {
      return;
    }

    if (input.trim()) {

      const newMessage: Message = {
        role: 'user',
        content: input
      };

      if (chatHistoryFile) {
        app.vault.append(chatHistoryFile, `user: ${input}\n***\n`);
      }

      setMessages([...messages, newMessage as Message]);

      const params = {
        newMessage: newMessage,
        messages: messages,
        noteContext: noteContext
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
      };

      if (assistant.stream) {
        for await (const { content } of assistant.streamResponse(params)) {
          assistantMessage.content += content;

          setMessages((prevMessages: Message[]) => {
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
      } else {
        const { content } = await assistant.response(params);
        assistantMessage.content = content;

        setMessages((prevMessages: Message[]) => {
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
        app.vault.append(chatHistoryFile, `assistant: ${assistantMessage.content}\n***\n`);
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
    if (chatHistoryFile) {
      await renameChatHistoryFile(chatHistoryFile, app, settings);
    }
    const newChatHistoryFile = await createChatHistoryFile(
      assistantFile as TFile,
      app,
      settings
    );
    setChatHistoryFile(newChatHistoryFile);
    resetAssistant();
    setMessages([]);
  }

  return (
    <div className="chat-container">
      <div className="chat-header flex">
        <div>
          <h1>
            {assistantFile?.basename || ""}
          </h1>
          <p className="model-name">Model: {assistant?.model || ""}</p>
        </div>
        <div className="new-chat-button tool-tip" onClick={handleNewChatButtonClick} data-tooltip="Start a new chat">
          <SquarePen size={24} />
        </div>
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