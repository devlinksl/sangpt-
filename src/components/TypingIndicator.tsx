import { memo } from 'react';

/**
 * Minimal, native-feeling loading indicator.
 * A single, subtly pulsing dot — no snake/typewriter animations.
 * Used uniformly for: first message, new chat, API request, AI response wait.
 */
export const TypingIndicator = memo(() => {
  return (
    <div className="flex items-start gap-3 animate-fade-in" aria-label="Loading response">
      <div className="flex items-center py-4 px-1">
        <span className="typing-dot" />
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
