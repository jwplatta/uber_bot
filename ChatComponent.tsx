import { FC, KeyboardEvent, useRef, useEffect, useState } from 'react';
import { SquarePen, ArrowUp } from 'lucide-react';
import { App } from 'obsidian';
import OpenAI from 'openai';
import * as dotenv from "dotenv";
import ReactMarkdown from 'react-markdown';
import { AssistantMessage } from './AssistantMessage';

dotenv.config();

interface ChatComponentProps {
  app: App;
}

interface Message {
  role: string;
  content: string;
}

const openai = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true
});

export const ChatComponent: FC<ChatComponentProps> = ({ app }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null as any);
  const [showInput, setShowInput] = useState(true);

  useEffect(() => {
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
      const newMessage: OpenAI.Chat.ChatCompletionMessageParam = {
        role: 'user',
        content: input,
      };

      let messagesContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are a helpful assistant." },
      ]

      messagesContext = messagesContext.concat(messages as OpenAI.Chat.ChatCompletionMessageParam[]);
      messagesContext.push(newMessage);

      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: messagesContext, //[{ role: 'user', content: 'Say this is a test' }],
        model: "gpt-4o-mini",
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

  const handleNewChatButtonClick = () => {
    setMessages([]);
    console.log("New chat button clicked");
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        {/* <a href="#" onClick={() => handleFileLinkClick('new-file.md')}>
          (Open file)
        </a> */}
        <div className="new-chat-button tool-tip" onClick={handleNewChatButtonClick} data-tooltip="Start a new chat">
          <SquarePen size={24} />
        </div>
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