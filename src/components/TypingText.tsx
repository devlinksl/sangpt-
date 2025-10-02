import { useState, useEffect } from 'react';
import { MessageFormatter } from './MessageFormatter';

interface TypingTextProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export const TypingText = ({ text, onComplete, speed = 10 }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <MessageFormatter content={displayedText} />;
};
