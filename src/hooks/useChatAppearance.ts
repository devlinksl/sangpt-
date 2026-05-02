import { useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';

/**
 * Applies chat appearance preferences (font style, density, bubble style)
 * as data-* attributes on <html> so CSS variables can pick them up globally.
 */
export function useChatAppearance() {
  const { preferences } = useUserPreferences();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-style', preferences.font_style || 'sans');
    root.setAttribute('data-chat-density', preferences.chat_density || 'comfortable');
    root.setAttribute('data-bubble-style', preferences.bubble_style || 'rounded');
    root.setAttribute('data-font-size', preferences.font_size || 'default');
  }, [preferences.font_style, preferences.chat_density, preferences.bubble_style, preferences.font_size]);
}
