import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Image,
  Camera,
  FileText,
  Send,
  Square,
  Plus,
  X,
} from 'lucide-react';
import { SpeechToText } from '@/components/SpeechToText';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Text line-height, in px — the visual height of one line of typed text.
 * Kept separate from MIN_HEIGHT so padding math stays explicit.
 */
const LINE_HEIGHT = 24;
/** Vertical padding (top + bottom, each) inside the textarea, in px. */
const PADDING_Y = 6;
/** Collapsed, single-line height of the textarea — matches the 36px (h-9) icon buttons so everything lines up on one row without any icon looking off-center. */
const MIN_HEIGHT = LINE_HEIGHT + PADDING_Y * 2; // 36
/** ~5 lines before the textarea starts scrolling internally. */
const MAX_HEIGHT = LINE_HEIGHT * 5 + PADDING_Y * 2; // 132

export interface ChatInputBarHandle {
  setText: (text: string) => void;
  getText: () => string;
  focus: () => void;
}

interface ChatInputBarProps {
  initialValue?: string;
  onSend: (text: string) => void;
  onAttachment: (type: 'image' | 'camera' | 'file') => void;
  /** Optional and currently unused — the model-selector button was removed from the UI. Kept so existing callers that still pass it don't break. */
  onModelSelect?: () => void;
  onRecordingChange: (isRecording: boolean) => void;
  onTranscription: (text: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  isStoppable: boolean;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * Floating message composer.
 *
 * Layout / positioning notes:
 * - This component renders in-flow and expects its parent to be the element
 *   that floats it (see `.san-input-area` in ChatInterface). The parent is
 *   absolutely positioned inside the chat root and offset by the measured
 *   on-screen keyboard inset, which keeps the pill above the keyboard while
 *   typing. Making this component `fixed` would escape that wrapper and pin it
 *   to the layout viewport — which sits *behind* the keyboard on mobile.
 * - Safe-area / nav-bar spacing is likewise owned by the parent wrapper.
 * - It writes its own rendered height to a `--chat-composer-height` CSS
 *   custom property on the document root every time it resizes. The
 *   scrolling chat/message list should add this as bottom padding so the
 *   last message is never hidden behind the floating pill, e.g.:
 *
 *     .chat-scroll-area {
 *       padding-bottom: calc(var(--chat-composer-height, 64px) + env(safe-area-inset-bottom, 0px) + 24px);
 *     }
 */
export const ChatInputBar = forwardRef<ChatInputBarHandle, ChatInputBarProps>(({
  initialValue = '',
  onSend,
  onAttachment,
  onRecordingChange,
  onTranscription,
  isLoading,
  isRecording,
  isStoppable,
  onStop,
  disabled,
}, ref) => {
  const [text, setText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(initialValue.length > 0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const sendLockRef = useRef(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { lightTap, mediumTap } = useHaptics();

  // ─── Grow / shrink the textarea to fit its content ────────────────────────
  const resize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    // Collapse first so shrinking (e.g. deleting lines) is measured correctly.
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)}px`;
  }, []);

  // ─── Auto-focus on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ─── Close attach menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    if (attachMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [attachMenuOpen]);

  // ─── Publish the composer's rendered height as a CSS var ──────────────────
  // Lets the chat/message list add exactly enough bottom padding to stay
  // visible beneath the floating pill, even as it grows/shrinks with content
  // or the keyboard/safe-area changes.
  useEffect(() => {
    const el = pillRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const publishHeight = () => {
      document.documentElement.style.setProperty(
        '--chat-composer-height',
        `${el.offsetHeight}px`,
      );
    };
    publishHeight();
    const ro = new ResizeObserver(publishHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    setText: (t: string) => {
      setText(t);
      setHasContent(t.length > 0);
      if (textareaRef.current) textareaRef.current.value = t;
      requestAnimationFrame(() => resize(textareaRef.current));
    },
    getText: () => text,
    focus: () => textareaRef.current?.focus(),
  }), [text, resize]);

  // ─── Unlock send when loading finishes ────────────────────────────────────
  useEffect(() => {
    if (!isLoading) sendLockRef.current = false;
  }, [isLoading]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setText(v);
    if ((v.length > 0) !== hasContent) setHasContent(v.length > 0);
    resize(e.target);
  }, [hasContent, resize]);

  const performSend = useCallback(() => {
    const t = textareaRef.current?.value ?? text;
    if (!t.trim() || sendLockRef.current) return;
    sendLockRef.current = true;
    mediumTap();
    onSend(t);
    setText('');
    setHasContent(false);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      // Smoothly collapse back to a single line.
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
    }
  }, [onSend, text, mediumTap]);

  // ─── Enter sends, Shift+Enter = newline ───────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't send while a CJK IME composition is being confirmed.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSend();
    }
  }, [performSend]);

  const handleAttachOption = (type: 'image' | 'camera' | 'file') => {
    lightTap();
    setAttachMenuOpen(false);
    onAttachment(type);
  };

  const handleSendClick = () => {
    if (isLoading && isStoppable) {
      mediumTap();
      onStop();
    } else {
      performSend();
    }
  };

  const isInputDisabled = disabled || isRecording;
  const isSendDisabled = (!hasContent && !isLoading) || (isLoading && !isStoppable);

  const attachOptions = [
    { type: 'image' as const, icon: Image, label: 'Photo' },
    { type: 'camera' as const, icon: Camera, label: 'Camera' },
    { type: 'file' as const, icon: FileText, label: 'File' },
  ];

  return (
    // In-flow inside the parent's floating composer wrapper (`.san-input-area`),
    // which is what actually offsets the pill above the on-screen keyboard using
    // the measured keyboard inset. Using `fixed` here would escape that wrapper
    // and pin the pill to the layout viewport — i.e. behind the keyboard.
    // `pointer-events-none` keeps the transparent margins from swallowing taps
    // on the chat behind it; it's re-enabled on the pill itself below.
    <div className="relative z-40 flex w-full justify-center pointer-events-none">
      <div className="w-full max-w-3xl px-3 pointer-events-auto">
        {/* Compact single-line pill — grows vertically only as lines are added */}
        <div
          ref={pillRef}
          className={cn(
            'flex items-end gap-1.5 rounded-[26px] p-1',
            'bg-card/90 dark:bg-card/80 backdrop-blur-xl border transition-[border-color,box-shadow] duration-200 ease-out',
            'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] gpu-accelerated',
            isFocused
              ? 'border-primary/40 shadow-primary/10 dark:shadow-primary/10'
              : 'border-border/50',
          )}
        >
          {/* Attachment menu */}
          <div className="relative shrink-0 self-end" ref={attachMenuRef}>
            <button
              type="button"
              onClick={() => { lightTap(); setAttachMenuOpen(prev => !prev); }}
              disabled={isInputDisabled}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                attachMenuOpen
                  ? 'bg-primary/15 text-primary rotate-45'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
              aria-label="Attach file"
            >
              {attachMenuOpen
                ? <X className="h-5 w-5 transition-transform duration-200" />
                : <Plus className="h-5 w-5 transition-transform duration-200" />
              }
            </button>

            {/* Popover attach menu */}
            <div
              className={cn(
                'absolute bottom-full left-0 mb-2 flex flex-col gap-1 p-1.5 rounded-2xl bg-popover border border-border/60 shadow-xl shadow-black/10 dark:shadow-black/30 backdrop-blur-xl transition-all duration-200 origin-bottom-left z-50',
                attachMenuOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 translate-y-1 pointer-events-none',
              )}
            >
              {attachOptions.map(({ type, icon: Icon, label }, i) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAttachOption(type)}
                  disabled={isInputDisabled}
                  style={{ transitionDelay: attachMenuOpen ? `${i * 40}ms` : '0ms' }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 active:scale-95 transition-all duration-150 min-w-[120px] disabled:opacity-50 disabled:pointer-events-none',
                    attachMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
                  )}
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea — takes all the freed-up width now that the model selector is gone */}
          <textarea
            ref={textareaRef}
            defaultValue={initialValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            disabled={isInputDisabled}
            rows={1}
            style={{ height: MIN_HEIGHT, lineHeight: `${LINE_HEIGHT}px`, maxHeight: MAX_HEIGHT }}
            className="flex-1 min-w-0 self-end bg-transparent text-foreground placeholder:text-muted-foreground/50 text-[15px] resize-none outline-none overflow-y-auto py-1.5 px-2 transition-[height] duration-100 ease-out"
          />

          {/* Speech to text */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center self-end">
            <SpeechToText
              onTranscription={(t) => {
                onTranscription(t);
                if (textareaRef.current) {
                  textareaRef.current.value = t;
                  setText(t);
                  setHasContent(t.length > 0);
                  resize(textareaRef.current);
                }
                onRecordingChange(false);
              }}
              disabled={isInputDisabled}
              onRecordingChange={onRecordingChange}
            />
          </div>

          {/* Send / stop */}
          <Button
            onClick={handleSendClick}
            disabled={isSendDisabled}
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0 self-end rounded-full shadow-md transition-all duration-200',
              isLoading && isStoppable
                ? 'bg-destructive hover:bg-destructive/90 scale-100'
                : hasContent
                  ? 'bg-primary hover:bg-primary/90 scale-100 shadow-primary/25'
                  : 'bg-muted text-muted-foreground scale-90 opacity-50 cursor-not-allowed',
            )}
            aria-label={isLoading && isStoppable ? 'Stop generating' : 'Send message'}
          >
            {isLoading && isStoppable ? (
              <Square className="h-3.5 w-3.5 text-destructive-foreground fill-current" />
            ) : (
              <Send className="h-4 w-4 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatInputBar.displayName = 'ChatInputBar';
