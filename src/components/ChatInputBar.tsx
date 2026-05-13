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
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(initialValue.length > 0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendLockRef = useRef(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { lightTap, mediumTap } = useHaptics();

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

  useImperativeHandle(ref, () => ({
    setText: (t: string) => {
      setText(t);
      setHasContent(t.length > 0);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height =
            Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
      });
    },
    getText: () => text,
    focus: () => textareaRef.current?.focus(),
  }), [text]);

  // ─── Unlock send when loading finishes ────────────────────────────────────
  useEffect(() => {
    if (!isLoading) sendLockRef.current = false;
  }, [isLoading]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setText(v);
    if ((v.length > 0) !== hasContent) setHasContent(v.length > 0);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
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

  // ─── Enter sends, Shift+Enter = newline ───────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="w-full max-w-3xl mx-auto px-3">
      <div
        className={cn(
          'relative rounded-[28px] bg-card/80 dark:bg-card/60 backdrop-blur-xl border transition-all duration-200 ease-out shadow-lg shadow-black/5 dark:shadow-black/20 overflow-visible gpu-accelerated',
          isFocused
            ? 'border-primary/40 shadow-primary/10 dark:shadow-primary/10'
            : 'border-border/50',
        )}
      >
        {/* Textarea */}
        <div className="px-4 pt-4 pb-2">
          <textarea
            ref={textareaRef}
            defaultValue={initialValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            disabled={isInputDisabled}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 text-base resize-none outline-none min-h-[28px] max-h-[150px] leading-relaxed touch-target"
            rows={1}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-center justify-between gap-2">

            {/* LEFT — attachment + model */}
            <div className="flex items-center gap-1">

              {/* Plus / attachment button */}
              <div className="relative" ref={attachMenuRef}>
                <button
                  type="button"
                  onClick={() => { lightTap(); setAttachMenuOpen(prev => !prev); }}
                  disabled={isInputDisabled}
                  className={cn(
                    'p-2.5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none touch-target',
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

              {/* Speech to text */}
              <div className="flex items-center justify-center">
                <SpeechToText
                  onTranscription={(t) => {
                    onTranscription(t);
                    if (textareaRef.current) {
                      textareaRef.current.value = t;
                      setText(t);
                      setHasContent(t.length > 0);
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors active:scale-95 ml-1 disabled:opacity-50 disabled:pointer-events-none touch-target"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>SanGPT</span>
              </button>
            </div>

            {/* RIGHT — send / stop */}
            <Button
              onClick={handleSendClick}
              disabled={isSendDisabled}
              size="icon"
              className={cn(
                'h-10 w-10 rounded-full shadow-md touch-target transition-all duration-200',
                isLoading && isStoppable
                  ? 'bg-destructive hover:bg-destructive/90 scale-100'
                  : hasContent
                    ? 'bg-primary hover:bg-primary/90 scale-100 shadow-primary/25'
                    : 'bg-muted text-muted-foreground scale-90 opacity-50 cursor-not-allowed',
              )}
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

      {/* Hint text */}
      <p className="text-center text-[11px] text-muted-foreground/40 mt-2 select-none">
        Enter to send · Shift + Enter for new line
      </p>
    </div>
  );
});

ChatInputBar.displayName = 'ChatInputBar';
