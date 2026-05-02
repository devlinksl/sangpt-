import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, ArrowUp, X } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

// ─── Global types ─────────────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  /* Mic trigger button */
  .stt-mic-btn {
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
    transition: color 0.15s ease, background 0.15s ease, transform 0.12s ease;
    flex-shrink: 0;
  }
  .stt-mic-btn:hover:not(:disabled) {
    color: hsl(var(--foreground));
    background: hsl(var(--accent) / 0.5);
  }
  .stt-mic-btn:active:not(:disabled) { transform: scale(0.88); }
  .stt-mic-btn:disabled { opacity: 0.38; cursor: not-allowed; }
  .stt-mic-btn.stt-active {
    color: #f87171;
    background: rgba(248,113,113,0.12);
  }

  /* ── Overlay wrapper — sits above the input bar ── */
  .stt-modal-wrap {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    right: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    pointer-events: none;
  }

  /* Transcript bubble */
  .stt-transcript-bubble {
    pointer-events: auto;
    background: hsl(var(--background) / 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid hsl(var(--border) / 0.3);
    border-radius: 14px;
    padding: 10px 14px;
    min-height: 42px;
    font-size: 13.5px;
    line-height: 1.6;
    color: hsl(var(--foreground));
    word-break: break-word;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    animation: stt-pop 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .stt-transcript-interim {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }
  .stt-transcript-placeholder {
    color: hsl(var(--muted-foreground) / 0.45);
    font-style: italic;
    font-size: 13px;
  }

  /* ── Main pill bar — matches reference image aesthetic ── */
  .stt-pill {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #1c1c1e;
    border-radius: 999px;
    /* left side has the X, right side has stop + send — same as reference */
    padding: 6px 6px 6px 6px;
    box-shadow:
      0 10px 40px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.06);
    animation: stt-pop 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* Waveform canvas */
  .stt-wave-area {
    flex: 1;
    height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    position: relative;
    padding: 0 4px;
  }
  .stt-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f87171;
    flex-shrink: 0;
    animation: stt-blink 1.1s ease-in-out infinite;
  }
  @keyframes stt-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.15; }
  }
  canvas.stt-canvas {
    flex: 1;
    height: 44px;
    display: block;
  }
  .stt-timer {
    font-size: 11px;
    font-family: 'SF Mono', ui-monospace, monospace;
    color: rgba(255,255,255,0.38);
    flex-shrink: 0;
    user-select: none;
    min-width: 30px;
    text-align: right;
  }

  /* Cancel X button — circle, left of pill */
  .stt-cancel-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .stt-cancel-btn:hover { background: rgba(255,255,255,0.18); }
  .stt-cancel-btn:active { transform: scale(0.88); }

  /* Stop square button */
  .stt-stop-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: rgba(255,255,255,0.13);
    color: rgba(255,255,255,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .stt-stop-btn:hover { background: rgba(255,255,255,0.22); }
  .stt-stop-btn:active { transform: scale(0.88); }

  /* Send circle button — white, like reference */
  .stt-send-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: #ffffff;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.12s ease, opacity 0.15s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.35);
  }
  .stt-send-btn:hover:not(:disabled) { background: #e8e8e8; }
  .stt-send-btn:active:not(:disabled) { transform: scale(0.88); }
  .stt-send-btn:disabled { opacity: 0.32; cursor: not-allowed; }

  /* Entrance animation */
  @keyframes stt-pop {
    from { opacity: 0; transform: translateY(10px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_COUNT = 40;
const BAR_W     = 3;
const BAR_GAP   = 2.5;
const BAR_R     = 1.5;
const BAR_MIN   = 2;
const BAR_MAX   = 34;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SpeechToTextProps {
  onTranscription: (text: string) => void;
  onSend?: (text: string) => void;
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

  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText]     = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed]         = useState(0);

  const recognitionRef  = useRef<any>(null);
  const finalTextRef    = useRef('');
  const isSendingRef    = useRef(false);
  const isStoppingRef   = useRef(false);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  // Scrolling bar history — newest bar pushed to right
  const barHistoryRef   = useRef<number[]>(Array(BAR_COUNT).fill(BAR_MIN));

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);

  // ── Draw scrolling waveform ───────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas   = canvasRef.current;
    if (!canvas) return;

    const analyser = analyserRef.current;
    const dpr      = window.devicePixelRatio || 1;
    const W        = canvas.offsetWidth;
    const H        = canvas.offsetHeight;

    // Only resize when dimensions actually change
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Sample volume
    let volume = 0;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      volume = data.reduce((a, b) => a + b, 0) / data.length / 255;
    }

    // Push new bar
    const jitter   = 0.7 + Math.random() * 0.3;
    const newH     = BAR_MIN + volume * (BAR_MAX - BAR_MIN) * jitter;
    barHistoryRef.current = [...barHistoryRef.current.slice(1), newH];

    // Render
    const totalW = BAR_COUNT * (BAR_W + BAR_GAP) - BAR_GAP;
    const startX = (W - totalW) / 2;
    const cy     = H / 2;

    barHistoryRef.current.forEach((h, i) => {
      const x         = startX + i * (BAR_W + BAR_GAP);
      const barH      = Math.max(BAR_MIN, h);
      const intensity = (barH - BAR_MIN) / (BAR_MAX - BAR_MIN);
      // Bars near edges are dimmer (fade effect)
      const edgeFade  = Math.min(i / 4, 1) * Math.min((BAR_COUNT - 1 - i) / 4, 1);
      const alpha     = (0.2 + intensity * 0.8) * edgeFade;

      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.roundRect(x, cy - barH / 2, BAR_W, barH, BAR_R);
      ctx.fill();
    });

    rafRef.current = requestAnimationFrame(drawFrame);
  }, []);

  // ── Start audio analyser + mic stream ────────────────────────────────────
  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const actx    = new AudioContext();
      const src     = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize               = 128;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      audioCtxRef.current = actx;
      analyserRef.current = analyser;
    } catch {
      // Mic denied — idle waveform still draws
    }
    drawFrame();
  }, [drawFrame]);

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current   = null;
    barHistoryRef.current = Array(BAR_COUNT).fill(BAR_MIN);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // ── Core stop recognition ─────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      recognitionRef.current.stop();
    }
    stopAnalyser();
    stopTimer();
  }, [stopAnalyser]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!isSupported) {
      alert({
        title: 'Not Supported',
        description: 'Speech recognition requires Chrome or Safari.',
        variant: 'destructive',
      });
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    recognitionRef.current = recognition;
    isStoppingRef.current  = false;
    isSendingRef.current   = false;
    finalTextRef.current   = '';
    setFinalText('');
    setInterimText('');

    recognition.onstart = () => {
      setIsRecording(true);
      onRecordingChange?.(true);
      startTimer();
      startAnalyser();
    };

    recognition.onresult = (event: any) => {
      let interim   = '';
      let confirmed = finalTextRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          confirmed += (confirmed ? ' ' : '') + r[0].transcript.trim();
        } else {
          interim += r[0].transcript;
        }
      }

      setFinalText(confirmed);
      finalTextRef.current = confirmed;
      setInterimText(interim);
      if (confirmed) onTranscription(confirmed);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      onRecordingChange?.(false);
      isStoppingRef.current = false;

      const text = finalTextRef.current.trim();
      if (text) {
        onTranscription(text);
        if (onSend && isSendingRef.current) {
          onSend(text);
          setFinalText('');
          finalTextRef.current = '';
        }
      }
      isSendingRef.current = false;
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        alert({
          title: 'Microphone Blocked',
          description: 'Allow microphone access in your browser settings.',
          variant: 'destructive',
        });
      } else if (e.error !== 'aborted') {
        alert({
          title: 'Recognition Error',
          description: 'Could not process speech. Please try again.',
          variant: 'destructive',
        });
      }
      setIsRecording(false);
      setInterimText('');
      onRecordingChange?.(false);
      stopAnalyser();
      stopTimer();
    };

    try {
      recognition.start();
    } catch {
      alert({ title: 'Start Error', description: 'Could not start recording.', variant: 'destructive' });
    }
  }, [isSupported, alert, onTranscription, onRecordingChange, onSend, startAnalyser, stopAnalyser]);

  // ── Button handlers ───────────────────────────────────────────────────────
  const handleMicClick = () => { if (!isRecording) startRecording(); };

  const handleStop = () => {
    isSendingRef.current = false;
    stopRecognition();
  };

  const handleCancel = () => {
    isSendingRef.current = false;
    finalTextRef.current = '';
    setFinalText('');
    setInterimText('');
    stopRecognition();
  };

  const handleSend = () => {
    isSendingRef.current = true;
    stopRecognition();
  };

  useEffect(() => {
    return () => {
      stopAnalyser();
      stopTimer();
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [stopAnalyser]);

  const displayText = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');
  const hasSpeech   = displayText.trim().length > 0;

  return (
    <>
      <style>{styles}</style>

      <div style={{ position: 'relative' }}>

        {/* ── Recording overlay ── */}
        {isRecording && (
          <div className="stt-modal-wrap">

            {/* Live transcript bubble */}
            <div className="stt-transcript-bubble">
              {hasSpeech ? (
                <>
                  {finalText && <span>{finalText}</span>}
                  {interimText && (
                    <span className="stt-transcript-interim">
                      {finalText ? ' ' : ''}{interimText}
                    </span>
                  )}
                </>
              ) : (
                <span className="stt-transcript-placeholder">Listening… start speaking</span>
              )}
            </div>

            {/* Pill bar */}
            <div className="stt-pill">

              {/* Cancel X — left circle */}
              <button className="stt-cancel-btn" onClick={handleCancel} title="Cancel">
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Waveform area */}
              <div className="stt-wave-area">
                <div className="stt-live-dot" />
                <canvas ref={canvasRef} className="stt-canvas" />
                <span className="stt-timer">{formatTime(elapsed)}</span>
              </div>

              {/* Stop square */}
              <button className="stt-stop-btn" onClick={handleStop} title="Stop — keep text">
                <Square size={13} fill="currentColor" strokeWidth={0} />
              </button>

              {/* Send circle */}
              <button
                className="stt-send-btn"
                onClick={handleSend}
                disabled={!hasSpeech}
                title="Send"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>

            </div>
          </div>
        )}

        {/* ── Mic trigger ── */}
        <button
          className={`stt-mic-btn ${isRecording ? 'stt-active' : ''}`}
          onClick={handleMicClick}
          disabled={disabled || !isSupported}
          title={!isSupported ? 'Requires Chrome or Safari' : 'Voice input'}
        >
          <Mic size={18} />
        </button>

      </div>
    </>
  );
};
