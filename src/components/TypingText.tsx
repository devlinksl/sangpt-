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
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (speed === 0) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (onComplete) onComplete();
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && currentIndex > 0) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <MessageFormatter content={displayedText} />;
};
