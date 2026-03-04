import { memo } from 'react';

export const TypingIndicator = memo(() => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex items-center gap-1.5 py-4 px-1">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
