import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Image,
  Camera,
  FileText,
  Send,
  Sparkles,
  Square,
  Plus,
  X,
} from 'lucide-react';
import { SpeechToText } from '@/components/SpeechToText';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

export interface ChatInputBarHandle {
  setText: (text: string) => void;
  getText: () => string;
  focus: () => void;
}

interface ChatInputBarProps {
  initialValue?: string;
  onSend: (text: string) => void;
  onAttachment: (type: 'image' | 'camera' | 'file') => void;
  onModelSelect: () => void;
  onRecordingChange: (isRecording: boolean) => void;
  onTranscription: (text: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  isStoppable: boolean;
  onStop: () => void;
  disabled?: boolean;
}

const inputStyles = `
  /* Hide scrollbar but keep scroll */
  .san-input-textarea {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .san-input-textarea::-webkit-scrollbar {
    display: none;
  }
`;

// Detect touch/mobile device — on mobile, Enter should always be a newline
const isMobile = typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export const ChatInputBar = forwardRef<ChatInputBarHandle, ChatInputBarProps>(({
  initialValue = '',
  onSend,
  onAttachment,
  onModelSelect,
  onRecordingChange,
  onTranscription,
  isLoading,
  isRecording,
  isStoppable,
  onStop,
  disabled,
}, ref) => {
  const [text, setText] = useState(initialValue);
  const [hasContent, setHasContent] = useState(initialValue.length > 0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendLockRef = useRef(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { lightTap, mediumTap } = useHaptics();

  // ── Auto-focus on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Close attach menu on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    if (attachMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [attachMenuOpen]);

  useImperativeHandle(ref, () => ({
    setText: (t: string) => {
      setText(t);
      setHasContent(t.length > 0);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }
      });
    },
    getText: () => text,
    focus: () => textareaRef.current?.focus(),
  }), [text]);

  useEffect(() => {
    if (!isLoading) sendLockRef.current = false;
  }, [isLoading]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setText(v);
    if ((v.length > 0) !== hasContent) setHasContent(v.length > 0);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, [hasContent]);

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
      textareaRef.current.style.height = 'auto';
    }
  }, [onSend, text, mediumTap]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile/Android: Enter always inserts a newline — never sends
    if (isMobile) return;
    // On desktop: Enter sends, Shift+Enter inserts newline
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
    if (isLoading && isStoppable) { mediumTap(); onStop(); }
    else performSend();
  };

  const isInputDisabled = disabled || isRecording;
  const isSendDisabled = (!hasContent && !isLoading) || (isLoading && !isStoppable);

  const attachOptions = [
    { type: 'image' as const,  icon: Image,    label: 'Photo'  },
    { type: 'camera' as const, icon: Camera,   label: 'Camera' },
    { type: 'file' as const,   icon: FileText, label: 'File'   },
  ];

  return (
    <>
      <style>{inputStyles}</style>

      <div className="w-full max-w-3xl mx-auto px-4 pb-2">

        {/* ── Row: + | pill input | send ── */}
        <div className="flex items-end gap-2.5">

          {/* + button — bg-card matches app surface */}
          <div className="relative flex-shrink-0 self-end" ref={attachMenuRef}>
            <button
              type="button"
              onClick={() => { lightTap(); setAttachMenuOpen(p => !p); }}
              disabled={isInputDisabled}
              className={cn(
                'h-11 w-11 rounded-full flex items-center justify-center',
                'bg-card text-muted-foreground border border-border',
                'hover:text-foreground hover:bg-accent active:scale-90 transition-all duration-150',
                'disabled:opacity-40 disabled:pointer-events-none',
              )}
              aria-label="Attach"
            >
              {attachMenuOpen
                ? <X className="h-[18px] w-[18px]" />
                : <Plus className="h-[18px] w-[18px]" />
              }
            </button>

            {/* Attach popover */}
            <div
              className={cn(
                'absolute bottom-full left-0 mb-2 flex flex-col gap-0.5 p-1.5 min-w-[130px]',
                'rounded-2xl bg-popover border border-border shadow-xl z-50',
                'transition-all duration-200 origin-bottom-left',
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
                  style={{ transitionDelay: attachMenuOpen ? `${i * 35}ms` : '0ms' }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'text-foreground hover:bg-accent/70 active:scale-95',
                    'transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
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

          {/* ── Pill — bg-card is the same token your app uses for surfaces ── */}
          <div className="flex-1 flex items-end rounded-[26px] border border-border bg-card px-4 py-2.5 gap-2 transition-all duration-150">

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              defaultValue={initialValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              disabled={isInputDisabled}
              rows={1}
              className="san-input-textarea flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-[15px] resize-none outline-none leading-[1.6] overflow-y-auto self-end"
              style={{ minHeight: '26px', maxHeight: '120px' }}
            />

            {/* Mic — disappears when user types, reappears when empty */}
            <div
              className={cn(
                'flex-shrink-0 self-end transition-all duration-200',
                hasContent
                  ? 'opacity-0 w-0 overflow-hidden pointer-events-none'
                  : 'opacity-100 w-auto',
              )}
            >
              <SpeechToText
                onTranscription={(t) => {
                  onTranscription(t);
                  if (textareaRef.current) {
                    textareaRef.current.value = t;
                    setText(t);
                    setHasContent(t.length > 0);
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                  }
                  onRecordingChange(false);
                }}
                disabled={isInputDisabled}
                onRecordingChange={onRecordingChange}
              />
            </div>

            {/* Model selector */}
            <button
              type="button"
              onClick={() => { lightTap(); onModelSelect(); }}
              disabled={isInputDisabled}
              className="flex-shrink-0 self-end flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border text-muted-foreground text-[13px] font-medium hover:text-foreground hover:bg-accent active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>SanGPT</span>
            </button>
          </div>

          {/* Send / stop — standalone circle */}
          <div className="flex-shrink-0 self-end">
            <Button
              onClick={handleSendClick}
              disabled={isSendDisabled}
              size="icon"
              className={cn(
                'h-11 w-11 rounded-full transition-all duration-200 shadow-none',
                isLoading && isStoppable
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : hasContent
                    ? 'bg-foreground hover:bg-foreground/85 text-background scale-100'
                    : 'bg-card text-muted-foreground/40 border border-border scale-95 cursor-not-allowed',
              )}
            >
              {isLoading && isStoppable
                ? <Square className="h-3.5 w-3.5 fill-current" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* Hint — updated to reflect mobile behaviour */}
        <p className="text-center text-[11px] text-muted-foreground/30 mt-2 select-none">
          {isMobile ? 'Tap send button to send' : 'Enter to send · Shift + Enter for new line'}
        </p>
      </div>
    </>
  );
});

ChatInputBar.displayName = 'ChatInputBar';
