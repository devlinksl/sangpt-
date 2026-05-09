import { useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';

/**
 * Applies chat appearance preferences as data-* attributes on <html>
 * so CSS variables can pick them up globally without re-rendering.
 */
export function useChatAppearance() {
  const { preferences } = useUserPreferences();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-style', preferences.font_style || 'sans');
    root.setAttribute('data-chat-density', preferences.chat_density || 'comfortable');
    root.setAttribute('data-bubble-style', preferences.bubble_style || 'rounded');
    root.setAttribute('data-font-size', preferences.font_size || 'default');
    root.setAttribute('data-ai-style', preferences.ai_response_style || 'chatgpt');
    root.setAttribute('data-anim', preferences.animation_intensity || 'medium');
    root.setAttribute('data-response-width', preferences.response_width || 'standard');
  }, [
    preferences.font_style,
    preferences.chat_density,
    preferences.bubble_style,
    preferences.font_size,
    preferences.ai_response_style,
    preferences.animation_intensity,
    preferences.response_width,
  ]);
}
