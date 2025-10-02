import { MessageFormatter } from './MessageFormatter';

interface MessageDisplayProps {
  content: string;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

export const MessageDisplay = ({ content, isTyping = false }: MessageDisplayProps) => {
  return <MessageFormatter content={content} />;
};
