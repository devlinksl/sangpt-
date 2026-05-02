import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

// ─── Types ────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  /* Mic button — idle */
  .san-stt-btn {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: hsl(var(--muted-foreground));
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
    flex-shrink: 0;
  }

  .san-stt-btn:hover:not(:disabled) {
    color: hsl(var(--foreground));
    background: hsl(var(--accent) / 0.5);
  }

  .san-stt-btn:active:not(:disabled) {
    transform: scale(0.9);
  }

  .san-stt-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Mic button — recording state */
  .san-stt-btn.recording {
    color: #f87171;
    background: rgba(248, 113, 113, 0.12);
  }

  .san-stt-btn.recording:hover:not(:disabled) {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }

  /* Ripple ring around mic when recording */
  .san-stt-btn.recording::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 14px;
    border: 1.5px solid rgba(248, 113, 113, 0.4);
    animation: san-stt-ring 1.6s ease-out infinite;
  }

  @keyframes san-stt-ring {
    0%   { opacity: 0.7; transform: scale(1); }
    100% { opacity: 0;   transform: scale(1.45); }
  }

  /* Processing spinner */
  .san-stt-spinner {
    animation: san-stt-spin 0.8s linear infinite;
  }

  @keyframes san-stt-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* Overlay panel shown while recording */
  .san-stt-overlay {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    right: 0;
    z-index: 50;
    background: hsl(var(--background) / 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(248, 113, 113, 0.25);
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    animation: san-stt-pop 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }

  @keyframes san-stt-pop {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)  scale(1); }
  }

  .san-stt-overlay-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .san-stt-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f87171;
    animation: san-stt-blink 1.1s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes san-stt-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }

  .san-stt-live-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #f87171;
    font-family: 'SF Mono', ui-monospace, monospace;
  }

  .san-stt-interim {
    font-size: 13px;
    color: hsl(var(--foreground) / 0.5);
    font-style: italic;
    line-height: 1.5;
    min-height: 20px;
    word-break: break-word;
  }

  .san-stt-overlay-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid hsl(var(--border) / 0.3);
    gap: 8px;
  }

  .san-stt-hint {
    font-size: 10px;
    color: hsl(var(--muted-foreground) / 0.6);
  }

  .san-stt-action-btns {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Stop button */
  .san-stt-stop-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.1);
    color: #f87171;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .san-stt-stop-btn:hover {
    background: rgba(248,113,113,0.18);
    border-color: rgba(248,113,113,0.5);
  }

  /* Send button inside overlay */
  .san-stt-send-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 8px;
    border: none;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .san-stt-send-btn:hover {
    opacity: 0.88;
    transform: scale(1.03);
  }

  .san-stt-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* Waveform bars */
  .san-stt-waveform {
    display: flex;
    align-items: center;
    gap: 2.5px;
    height: 18px;
    margin-left: auto;
  }

  .san-stt-bar {
    width: 3px;
    border-radius: 2px;
    background: #f87171;
    opacity: 0.7;
    animation: san-stt-wave 0.9s ease-in-out infinite;
  }

  .san-stt-bar:nth-child(1) { animation-delay: 0s;    height: 5px; }
  .san-stt-bar:nth-child(2) { animation-delay: 0.12s; height: 12px; }
  .san-stt-bar:nth-child(3) { animation-delay: 0.24s; height: 18px; }
  .san-stt-bar:nth-child(4) { animation-delay: 0.12s; height: 12px; }
  .san-stt-bar:nth-child(5) { animation-delay: 0s;    height: 5px; }

  @keyframes san-stt-wave {
    0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
    50%       { transform: scaleY(1);   opacity: 1; }
  }
`;

// ─── Props ────────────────────────────────────────────────────────────────────
interface SpeechToTextProps {
  onTranscription: (text: string) => void;
  onSend?: (text: string) => void;         // auto-send callback
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SpeechToText = ({
  onTranscription,
  onSend,
  disabled,
  onRecordingChange,
}: SpeechToTextProps) => {
  const { alert } = useAlert();

  const [isRecording, setIsRecording]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimText, setInterimText]   = useState('');   // live partial transcript
  const [finalText, setFinalText]       = useState('');   // confirmed transcript

  const recognitionRef = useRef<any>(null);
  const finalTextRef   = useRef('');   // always up-to-date for callbacks
  const isStoppingRef  = useRef(false);

  // Keep ref in sync
  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);

  // ─── Check browser support ───────────────────────────────────────────────
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ─── Stop recognition cleanly ────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  // ─── Commit transcript to input bar ─────────────────────────────────────
  const commitTranscript = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onTranscription(trimmed);   // puts text into the input bar
  }, [onTranscription]);

  // ─── Stop + send ─────────────────────────────────────────────────────────
  const handleStopAndSend = useCallback(() => {
    stopRecognition();
    // onSend is called in the onend handler below after recognition stops
  }, [stopRecognition]);

  // ─── Stop only (keep text in bar) ────────────────────────────────────────
  const handleStop = useCallback(() => {
    stopRecognition();
  }, [stopRecognition]);

  // ─── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!isSupported) {
      alert({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser. Try Chrome or Safari.',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;   // keep listening until stopped
    recognition.interimResults  = true;   // show partial results live
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    isStoppingRef.current  = false;
    finalTextRef.current   = '';
    setFinalText('');
    setInterimText('');

    recognition.onstart = () => {
      setIsRecording(true);
      onRecordingChange?.(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let confirmed = finalTextRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result    = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          confirmed += (confirmed ? ' ' : '') + transcript.trim();
        } else {
          interim += transcript;
        }
      }

      setFinalText(confirmed);
      finalTextRef.current = confirmed;
      setInterimText(interim);

      // Mirror confirmed text live into the input bar
      if (confirmed) onTranscription(confirmed);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
      setInterimText('');
      onRecordingChange?.(false);
      isStoppingRef.current = false;

      const text = finalTextRef.current.trim();

      if (text) {
        // Always put final text in input bar
        onTranscription(text);

        // If user hit the send button, auto-send
        if (onSend && isSendingRef.current) {
          onSend(text);
          setFinalText('');
          finalTextRef.current = '';
        }
      }

      isSendingRef.current = false;
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is not a real error — just silence
      if (event.error === 'no-speech') return;

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        alert({
          title: 'Microphone Blocked',
          description: 'Please allow microphone access in your browser settings.',
          variant: 'destructive',
        });
      } else if (event.error !== 'aborted') {
        alert({
          title: 'Recognition Error',
          description: 'Could not process speech. Please try again.',
          variant: 'destructive',
        });
      }

      setIsRecording(false);
      setIsProcessing(false);
      setInterimText('');
      onRecordingChange?.(false);
    };

    try {
      recognition.start();
    } catch (err) {
      alert({
        title: 'Start Error',
        description: 'Could not start speech recognition.',
        variant: 'destructive',
      });
    }
  }, [isSupported, alert, onTranscription, onRecordingChange, onSend]);

  // Ref to track if stop came from the "send" button
  const isSendingRef = useRef(false);

  const handleStopAndSendClick = useCallback(() => {
    isSendingRef.current = true;
    stopRecognition();
  }, [stopRecognition]);

  const handleStopClick = useCallback(() => {
    isSendingRef.current = false;
    stopRecognition();
  }, [stopRecognition]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      handleStopClick();
    } else {
      startRecording();
    }
  }, [isRecording, handleStopClick, startRecording]);

  const displayText = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');

  return (
    <>
      <style>{styles}</style>

      <div style={{ position: 'relative' }}>
        {/* ─── Recording Overlay Panel ─── */}
        {isRecording && (
          <div className="san-stt-overlay">
            {/* Header */}
            <div className="san-stt-overlay-header">
              <div className="san-stt-live-dot" />
              <span className="san-stt-live-label">Listening</span>
              <div className="san-stt-waveform">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="san-stt-bar" />
                ))}
              </div>
            </div>

            {/* Live transcript preview */}
            <p className="san-stt-interim">
              {displayText || (
                <span style={{ opacity: 0.35 }}>Start speaking…</span>
              )}
            </p>

            {/* Actions */}
            <div className="san-stt-overlay-actions">
              <span className="san-stt-hint">Tap stop to keep • Send to deliver</span>
              <div className="san-stt-action-btns">
                {/* Stop — keeps text in bar */}
                <button className="san-stt-stop-btn" onClick={handleStopClick}>
                  <MicOff size={11} />
                  Stop
                </button>

                {/* Send — stops + fires onSend */}
                {onSend && (
                  <button
                    className="san-stt-send-btn"
                    onClick={handleStopAndSendClick}
                    disabled={!displayText.trim()}
                  >
                    <Send size={11} />
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Mic Button ─── */}
        <button
          className={`san-stt-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleMicClick}
          disabled={disabled || isProcessing || !isSupported}
          title={
            !isSupported
              ? 'Speech recognition not supported in this browser'
              : isRecording
                ? 'Stop recording'
                : 'Start voice input'
          }
        >
          {isProcessing ? (
            <Loader2 size={18} className="san-stt-spinner" />
          ) : isRecording ? (
            <MicOff size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>
      </div>
    </>
  );
};
