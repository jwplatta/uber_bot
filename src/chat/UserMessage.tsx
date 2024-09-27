import ReactMarkdown from 'react-markdown';
import { FC } from 'react';

interface UserMessageProps {
  content: string;
}

export const UserMessage: FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="chat-user-message">
      <ReactMarkdown>{content || ""}</ReactMarkdown>
    </div>
  );
}