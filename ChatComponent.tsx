import { FC, KeyboardEvent, useRef, useEffect, useState } from 'react';
import { App, FileSystemAdapter } from 'obsidian';

interface ChatComponentProps {
  app: App;
}

interface Message {
  type: string;
  text: string;
}

export const ChatComponent: FC<ChatComponentProps> = ({ app }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    console.log(messages);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const newMessage: Message = {
        type: 'user',
        text: input,
      };

      const files = app.vault.getMarkdownFiles();
      console.log(files);
      const msgResponse: Message = {
        type: 'bot',
        text: files[0].path,
      };

      setMessages([...messages, newMessage, msgResponse]);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        // Command + Enter (macOS) or Ctrl + Enter (Windows/Linux)
        handleSendMessage();
      } else if (!e.shiftKey) {
        // Just Enter key without Shift (prevent shift + enter newline)
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat</h1>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          message.type === 'bot' ? (
            <div key={index} className="chat-bot-message">
              {message.text}
            </div>
          ) : (
          <div key={index} className="chat-user-message">
            {message.text}
          </div>
        )))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="chat-input"
        />
      </div>
    </div>
  );
};