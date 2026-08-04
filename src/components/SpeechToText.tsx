import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, X, Check, AlertTriangle, RotateCcw } from 'lucide-react';
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
  /* Mic trigger button (sits inline in ChatInputBar) */
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

  /* ══════════════════════════════════════════════════════════════════════
     Bottom sheet drawer
     ══════════════════════════════════════════════════════════════════════ */

  .stt-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    opacity: 0;
    animation: stt-fade-in 0.28s ease forwards;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .stt-backdrop.stt-closing {
    animation: stt-fade-out 0.22s ease forwards;
  }
  @keyframes stt-fade-in { to { opacity: 1; } }
  @keyframes stt-fade-out { to { opacity: 0; } }

  .stt-sheet {
    position: relative;
    width: 100%;
    max-width: 560px;
    max-height: 92vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin: 0 auto;
    background: hsl(var(--background) / 0.92);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid hsl(var(--border) / 0.25);
    border-bottom: none;
    border-radius: 28px 28px 0 0;
    box-shadow:
      0 -8px 40px rgba(0,0,0,0.35),
      0 -1px 0 rgba(255,255,255,0.04) inset;
    padding: 10px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(100%);
    animation: stt-slide-up 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    touch-action: none;
    cursor: grab;
  }
  .stt-sheet.stt-closing {
    animation: stt-slide-down 0.24s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  .stt-sheet.stt-dragging {
    animation: none;
    transition: none;
    cursor: grabbing;
  }
  @keyframes stt-slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes stt-slide-down {
    from { transform: translateY(0); }
    to   { transform: translateY(100%); }
  }

  @media (min-width: 720px) {
    .stt-sheet {
      border-radius: 28px;
      margin-bottom: 32px;
      border-bottom: 1px solid hsl(var(--border) / 0.25);
    }
  }

  @media (orientation: landscape) and (max-height: 480px) {
    .stt-sheet { padding-top: 6px; max-height: 96vh; }
    .stt-header { margin-bottom: 4px !important; }
    .stt-mic-stage { width: 96px !important; height: 96px !important; margin: 4px 0 !important; }
    .stt-wave-row { margin-top: 2px !important; }
  }

  /* Drag handle */
  .stt-handle-grip {
    width: 40px;
    height: 4px;
    border-radius: 999px;
    background: hsl(var(--muted-foreground) / 0.35);
    margin: 4px 0 14px 0;
    cursor: grab;
  }

  /* Header */
  .stt-header {
    text-align: center;
    margin-bottom: 18px;
  }
  .stt-title {
    font-size: clamp(14px, 4vw, 15px);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: hsl(var(--foreground));
    margin: 0 0 3px 0;
  }
  .stt-subtitle {
    font-size: clamp(11.5px, 3.2vw, 12.5px);
    color: hsl(var(--muted-foreground));
    margin: 0;
  }

  /* Mic stage — circular control with pulsing rings */
  .stt-mic-stage {
    position: relative;
    width: clamp(112px, 34vw, 148px);
    height: clamp(112px, 34vw, 148px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px 0 16px 0;
    transition: transform 0.05s linear;
  }
  .stt-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(248,113,113,0.35);
    opacity: 0;
  }
  .stt-mic-stage.stt-listening .stt-ring {
    animation: stt-ring-pulse 2.2s ease-out infinite;
  }
  .stt-ring-1 { width: 100%; height: 100%; animation-delay: 0s !important; }
  .stt-ring-2 { width: 100%; height: 100%; animation-delay: 0.7s !important; }
  .stt-ring-3 { width: 100%; height: 100%; animation-delay: 1.4s !important; }
  @keyframes stt-ring-pulse {
    0%   { transform: scale(0.6); opacity: 0.55; }
    100% { transform: scale(1.25); opacity: 0; }
  }
  /* Extra amplitude-reactive ring, scaled live from mic volume in JS */
  .stt-ring-live {
    width: 100%;
    height: 100%;
    border: 1.5px solid rgba(248,113,113,0.5);
    opacity: 0;
    will-change: transform, opacity;
  }

  .stt-mic-glow {
    position: absolute;
    width: 62%;
    height: 62%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(248,113,113,0.45) 0%, rgba(248,113,113,0) 70%);
    opacity: 0;
    /* transform/opacity are driven live from mic amplitude in JS while
       listening, so only transition the non-amplitude-driven fallback. */
    transition: opacity 0.3s ease;
    will-change: transform, opacity;
  }

  .stt-mic-circle {
    position: relative;
    width: 57%;
    height: 57%;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: hsl(var(--accent) / 0.7);
    color: hsl(var(--foreground));
    box-shadow:
      0 6px 20px rgba(0,0,0,0.18),
      0 0 0 1px hsl(var(--border) / 0.4) inset;
    transition: background 0.25s ease, box-shadow 0.25s ease;
    /* transform is driven live from mic amplitude in JS while listening */
    will-change: transform;
  }
  .stt-mic-circle:active { transform: scale(0.94); }
  .stt-mic-circle.stt-error-state {
    background: rgba(248,113,113,0.14);
    color: #f87171;
  }
  .stt-mic-stage.stt-listening .stt-mic-circle {
    background: linear-gradient(150deg, #f87171, #ef4444);
    color: #fff;
    box-shadow:
      0 8px 28px rgba(239,68,68,0.45),
      0 0 0 1px rgba(255,255,255,0.15) inset;
  }
  .stt-mic-stage.stt-processing .stt-mic-circle {
    background: hsl(var(--accent) / 0.7);
    color: hsl(var(--muted-foreground));
  }
  .stt-mic-icon-spin {
    animation: stt-spin 1.1s linear infinite;
  }
  @keyframes stt-spin { to { transform: rotate(360deg); } }

  /* Status text */
  .stt-status {
    font-size: clamp(13.5px, 3.8vw, 14.5px);
    font-weight: 600;
    color: hsl(var(--foreground));
    margin: 0 0 3px 0;
    min-height: 19px;
    text-align: center;
    transition: color 0.2s ease;
  }
  .stt-status-error { color: #f87171; }
  .stt-hint {
    font-size: clamp(11px, 3vw, 12px);
    color: hsl(var(--muted-foreground));
    margin: 0 0 4px 0;
    text-align: center;
    max-width: 320px;
  }

  /* Transcript preview — grows with content, auto-scrolls to newest words */
  .stt-transcript {
    width: 100%;
    max-height: min(30vh, 110px);
    overflow-y: auto;
    overscroll-behavior: contain;
    text-align: center;
    font-size: clamp(13px, 3.6vw, 13.5px);
    line-height: 1.5;
    color: hsl(var(--foreground) / 0.85);
    padding: 0 8px;
    margin-bottom: 8px;
    word-break: break-word;
    scroll-behavior: smooth;
    touch-action: pan-y;
  }
  .stt-transcript-interim {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }

  /* Waveform row */
  .stt-wave-row {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px 0 20px 0;
    opacity: 0.35;
    transition: opacity 0.25s ease;
  }
  .stt-wave-row.stt-wave-active { opacity: 1; }
  canvas.stt-canvas {
    width: 100%;
    height: 40px;
    display: block;
    color: hsl(var(--foreground));
  }

  /* Retry button (error state) */
  .stt-retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: hsl(var(--accent) / 0.6);
    color: hsl(var(--foreground));
    border: none;
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin: 6px 0 20px 0;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .stt-retry-btn:hover { background: hsl(var(--accent)); }
  .stt-retry-btn:active { transform: scale(0.95); }

  /* Bottom controls */
  .stt-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
  }
  .stt-btn {
    flex: 1;
    max-width: 220px;
    height: 50px;
    border-radius: 16px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.12s ease, opacity 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .stt-btn:active { transform: scale(0.96); }
  .stt-btn-cancel {
    background: hsl(var(--accent) / 0.6);
    color: hsl(var(--foreground));
  }
  .stt-btn-cancel:hover { background: hsl(var(--accent)); }
  .stt-btn-done {
    background: hsl(var(--foreground));
    color: hsl(var(--background));
  }
  .stt-btn-done:hover:not(:disabled) { opacity: 0.88; }
  .stt-btn-done:disabled { opacity: 0.35; cursor: not-allowed; }

  @media (prefers-reduced-motion: reduce) {
    .stt-sheet, .stt-backdrop, .stt-ring, .stt-mic-glow, .stt-mic-circle,
    .stt-mic-icon-spin, .stt-btn {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_COUNT = 32;
const BAR_W     = 3;
const BAR_GAP   = 3;
const BAR_R     = 1.5;
const BAR_MIN   = 3;
const BAR_MAX   = 30;
// Real finger travel (px) that counts as an intentional "swipe to dismiss",
// independent of how much rubber-band resistance visually damped it.
const DRAG_CLOSE_THRESHOLD = 100;
// Below this, the sheet follows the finger 1:1. Beyond it, resistance
// ramps up so the drag feels like stretching rubber instead of a rigid rail.
const RUBBER_FULL_TRAVEL   = 70;
const RUBBER_FACTOR        = 0.42;
// Dragging upward can't reveal anything above the sheet, so resist hard.
const RUBBER_UP_FACTOR     = 0.22;
// Two-finger / trackpad scroll-down over the sheet also dismisses it.
const WHEEL_CLOSE_THRESHOLD = 70;

/** Applies rubber-band resistance to a raw drag distance. */
function rubberBand(delta: number) {
  if (delta >= 0) {
    if (delta <= RUBBER_FULL_TRAVEL) return delta;
    return RUBBER_FULL_TRAVEL + (delta - RUBBER_FULL_TRAVEL) * RUBBER_FACTOR;
  }
  return delta * RUBBER_UP_FACTOR;
}

type UIState = 'idle' | 'listening' | 'processing' | 'error';

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

  const [isRecording, setIsRecording]   = useState(false);
  const [finalText, setFinalText]       = useState('');
  const [interimText, setInterimText]   = useState('');

  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [closing, setClosing]           = useState(false);
  const [uiState, setUiState]           = useState<UIState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef  = useRef<any>(null);
  const finalTextRef    = useRef('');
  const isSendingRef    = useRef(false);
  const isStoppingRef   = useRef(false);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const barHistoryRef   = useRef<number[]>(Array(BAR_COUNT).fill(BAR_MIN));
  const smoothedVolRef  = useRef(0);

  // Live amplitude-reactive elements — updated directly via refs each frame
  // (not React state) so the mic visibly reacts to real noise with no lag.
  const micGlowRef  = useRef<HTMLDivElement>(null);
  const micCircleRef = useRef<HTMLButtonElement>(null);
  const liveRingRef  = useRef<HTMLDivElement>(null);

  // Auto-scroll the live transcript to the newest words
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Drag-to-dismiss (rubber-band, whole sheet is grabbable)
  const sheetRef       = useRef<HTMLDivElement>(null);
  const dragStartYRef  = useRef<number | null>(null);
  const dragRawRef     = useRef(0);
  const wheelAccumRef  = useRef(0);
  const [dragging, setDragging] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);

  // ── Draw scrolling waveform ───────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const analyser = analyserRef.current;
    const dpr      = window.devicePixelRatio || 1;
    const W        = canvas.offsetWidth;
    const H        = canvas.offsetHeight;

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let volume = 0;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      volume = data.reduce((a, b) => a + b, 0) / data.length / 255;
    }

    // ── Live mic reactivity — the circle/glow/extra ring scale directly
    // with real input level (smoothed so it breathes instead of jittering).
    // This runs every frame regardless of UI state; it's a no-op visually
    // unless the "listening" class is active, but keeping it frame-accurate
    // means there's zero lag between blowing into the mic and seeing it.
    smoothedVolRef.current += (volume - smoothedVolRef.current) * 0.35;
    const v = Math.min(1, smoothedVolRef.current * 1.6); // headroom so normal speech visibly moves it

    if (micCircleRef.current) {
      micCircleRef.current.style.transform = `scale(${1 + v * 0.16})`;
    }
    if (micGlowRef.current) {
      micGlowRef.current.style.opacity = `${0.35 + v * 0.65}`;
      micGlowRef.current.style.transform = `scale(${1 + v * 0.45})`;
    }
    if (liveRingRef.current) {
      liveRingRef.current.style.opacity = `${v * 0.6}`;
      liveRingRef.current.style.transform = `scale(${1 + v * 0.3})`;
    }

    const jitter = 0.7 + Math.random() * 0.3;
    const newH   = BAR_MIN + volume * (BAR_MAX - BAR_MIN) * jitter;
    barHistoryRef.current = [...barHistoryRef.current.slice(1), newH];

    const totalW = BAR_COUNT * (BAR_W + BAR_GAP) - BAR_GAP;
    const startX = (W - totalW) / 2;
    const cy     = H / 2;

    // Fill color follows the canvas element's CSS `color` (theme-aware via
    // the .stt-canvas class), so alpha is applied with globalAlpha instead
    // of parsing the theme's color format.
    ctx.fillStyle = 'currentColor';

    barHistoryRef.current.forEach((h, i) => {
      const x         = startX + i * (BAR_W + BAR_GAP);
      const barH      = Math.max(BAR_MIN, h);
      const intensity = (barH - BAR_MIN) / (BAR_MAX - BAR_MIN);
      const edgeFade  = Math.min(i / 4, 1) * Math.min((BAR_COUNT - 1 - i) / 4, 1);
      const alpha     = (0.25 + intensity * 0.75) * edgeFade;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(x, cy - barH / 2, BAR_W, barH, BAR_R);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(drawFrame);
  }, []);

  // ── Start audio analyser + mic stream ────────────────────────────────────
  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const actx     = new AudioContext();
      const src       = actx.createMediaStreamSource(stream);
      const analyser  = actx.createAnalyser();
      analyser.fftSize               = 128;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      audioCtxRef.current = actx;
      analyserRef.current = analyser;
    } catch {
      // Mic denied for the analyser only — recognition itself has its own
      // permission path; the waveform simply stays idle if this fails.
    }
    drawFrame();
  }, [drawFrame]);

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current   = null;
    audioCtxRef.current   = null;
    streamRef.current     = null;
    barHistoryRef.current = Array(BAR_COUNT).fill(BAR_MIN);
    smoothedVolRef.current = 0;
    // Hand the amplitude-driven elements back to CSS (idle/error/processing
    // states) so they don't get stuck mid-pulse.
    if (micCircleRef.current) micCircleRef.current.style.transform = '';
    if (micGlowRef.current) { micGlowRef.current.style.opacity = ''; micGlowRef.current.style.transform = ''; }
    if (liveRingRef.current) { liveRingRef.current.style.opacity = ''; liveRingRef.current.style.transform = ''; }
  }, []);

  // ── Core stop recognition ─────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      setUiState('processing');
      recognitionRef.current.stop();
    }
    stopAnalyser();
  }, [stopAnalyser]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!isSupported) {
      setUiState('error');
      setErrorMessage('Voice input needs Chrome or Safari on this device.');
      return;
    }
    if (recognitionRef.current) return; // duplicate-start guard

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
    setErrorMessage('');

    recognition.onstart = () => {
      setIsRecording(true);
      setUiState('listening');
      onRecordingChange?.(true);
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
      isStoppingRef.current  = false;
      recognitionRef.current = null;

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

      // If we were closing the drawer, finish the close now that recognition
      // has actually stopped. Otherwise, drop back to idle inside the drawer.
      setDrawerOpen(open => {
        if (!open) return open;
        setUiState('idle');
        return open;
      });
    };

    recognition.onerror = (e: any) => {
      recognitionRef.current = null;
      if (e.error === 'no-speech') return;

      let message = 'Could not process speech. Please try again.';
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        message = 'Microphone access is blocked. Allow it in your browser settings and try again.';
      } else if (e.error === 'audio-capture') {
        message = 'No microphone was found on this device.';
      } else if (e.error === 'aborted') {
        setIsRecording(false);
        setInterimText('');
        onRecordingChange?.(false);
        stopAnalyser();
        return;
      }

      setIsRecording(false);
      setInterimText('');
      onRecordingChange?.(false);
      stopAnalyser();
      setUiState('error');
      setErrorMessage(message);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setUiState('error');
      setErrorMessage('Could not start the microphone. Please try again.');
    }
  }, [isSupported, onTranscription, onRecordingChange, onSend, startAnalyser, stopAnalyser]);

  // ── Drawer open / close ───────────────────────────────────────────────────
  const openDrawer = () => {
    if (disabled) return;
    if (!isSupported) {
      alert({
        title: 'Not Supported',
        description: 'Speech recognition requires Chrome or Safari.',
        variant: 'destructive',
      });
      return;
    }
    setClosing(false);
    setDrawerOpen(true);
    setUiState('idle');
    setErrorMessage('');
    // Auto-start listening as soon as the sheet opens, mirroring the
    // original single-tap-to-record behavior.
    requestAnimationFrame(() => startRecording());
  };

  const finishClose = useCallback(() => {
    setDrawerOpen(false);
    setClosing(false);
    setUiState('idle');
    setFinalText('');
    setInterimText('');
    finalTextRef.current = '';
  }, []);

  const closeDrawer = useCallback(() => {
    setClosing(true);
    window.setTimeout(finishClose, 240);
  }, [finishClose]);

  const handleCancel = () => {
    isSendingRef.current  = false;
    finalTextRef.current  = '';
    setFinalText('');
    setInterimText('');
    if (recognitionRef.current) {
      stopRecognition();
    }
    closeDrawer();
  };

  const handleDone = () => {
    isSendingRef.current = true;
    if (recognitionRef.current) {
      stopRecognition();
    }
    closeDrawer();
  };

  const handleMicTap = () => {
    if (uiState === 'error') {
      setUiState('idle');
      setErrorMessage('');
      startRecording();
    } else if (uiState === 'idle') {
      startRecording();
    }
    // While listening or processing, the center circle is not a toggle —
    // Cancel / Done control the session, matching the reference UX.
  };

  // ── Dismiss animations shared by drag, wheel, and button paths ───────────
  // dismissViaGesture: sheet is already offset by a live drag/scroll, so we
  // continue its motion smoothly to fully closed instead of snapping back
  // to 0 first (which is what the button-triggered CSS keyframe assumes).
  const dismissViaGesture = useCallback(() => {
    isSendingRef.current = false;
    finalTextRef.current = '';
    setFinalText('');
    setInterimText('');
    if (recognitionRef.current) stopRecognition();
    setClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.22s cubic-bezier(0.4,0,1,1)';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    window.setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
        sheetRef.current.style.transform = '';
      }
      finishClose();
    }, 220);
  }, [stopRecognition, finishClose]);

  const springBack = () => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)';
    sheetRef.current.style.transform = 'translateY(0px)';
    window.setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
        sheetRef.current.style.transform = '';
      }
    }, 430);
  };

  // ── Drag-to-dismiss gesture — grabbable from anywhere on the sheet, with
  // rubber-band resistance so it feels elastic rather than rigidly clamped.
  const onDragStart = (clientY: number) => {
    dragStartYRef.current = clientY;
    dragRawRef.current = 0;
    setDragging(true);
  };
  const onDragMove = (clientY: number) => {
    if (dragStartYRef.current === null || !sheetRef.current) return;
    const raw = clientY - dragStartYRef.current;
    dragRawRef.current = raw;
    sheetRef.current.style.transform = `translateY(${rubberBand(raw)}px)`;
  };
  const onDragEnd = () => {
    setDragging(false);
    const raw = dragRawRef.current;
    dragStartYRef.current = null;
    dragRawRef.current = 0;
    if (raw > DRAG_CLOSE_THRESHOLD) {
      dismissViaGesture();
    } else {
      springBack();
    }
  };

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest('button, .stt-transcript, a, input, textarea');

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isInteractiveTarget(e.target)) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onDragStart(e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartYRef.current !== null) onDragMove(e.clientY);
  };
  const handlePointerUp = () => {
    if (dragStartYRef.current !== null) onDragEnd();
  };

  // ── Scroll-to-dismiss — a trackpad/mouse-wheel scroll downward over the
  // sheet closes it too, mirroring the drag gesture for non-touch input.
  const handleWheel = (e: React.WheelEvent) => {
    if (dragStartYRef.current !== null) return; // mid-drag takes priority

    const sheet = sheetRef.current;
    if (sheet && sheet.scrollHeight > sheet.clientHeight) {
      const atBottom = sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - 1;
      if (!atBottom || e.deltaY < 0) { wheelAccumRef.current = 0; return; }
    }
    if (isInteractiveTarget(e.target) && e.target instanceof Element) {
      const transcript = e.target.closest('.stt-transcript') as HTMLElement | null;
      if (transcript) {
        const atBottom = transcript.scrollTop + transcript.clientHeight >= transcript.scrollHeight - 1;
        if (!atBottom || e.deltaY < 0) { wheelAccumRef.current = 0; return; }
      }
    }

    if (e.deltaY > 0) {
      wheelAccumRef.current += e.deltaY;
      if (wheelAccumRef.current > WHEEL_CLOSE_THRESHOLD) {
        wheelAccumRef.current = 0;
        dismissViaGesture();
      }
    } else {
      wheelAccumRef.current = 0;
    }
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAnalyser();
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [stopAnalyser]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [drawerOpen]);

  // Keep the live transcript scrolled to the newest words as they arrive
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [finalText, interimText]);

  const displayText = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');
  const hasSpeech    = displayText.trim().length > 0;

  const statusText = (() => {
    switch (uiState) {
      case 'listening':  return 'Listening…';
      case 'processing': return 'Converting speech…';
      case 'error':      return errorMessage || 'Something went wrong';
      default:           return 'Tap the microphone to start';
    }
  })();

  return (
    <>
      <style>{styles}</style>

      {/* ── Mic trigger — lives inline in ChatInputBar ── */}
      <button
        className={`stt-mic-btn ${isRecording ? 'stt-active' : ''}`}
        onClick={openDrawer}
        disabled={disabled || !isSupported}
        title={!isSupported ? 'Requires Chrome or Safari' : 'Voice input'}
      >
        <Mic size={18} />
      </button>

      {/* ── Bottom sheet voice drawer ── */}
      {drawerOpen && (
        <div
          className={`stt-backdrop ${closing ? 'stt-closing' : ''}`}
          onClick={handleCancel}
        >
          <div
            ref={sheetRef}
            className={`stt-sheet ${closing ? 'stt-closing' : ''} ${dragging ? 'stt-dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Drag handle — grabbable, but the whole sheet responds too */}
            <div className="stt-handle-grip" />

            {/* Header */}
            <div className="stt-header">
              <p className="stt-title">Voice Input</p>
              <p className="stt-subtitle">Speak and I'll convert your voice to text</p>
            </div>

            {/* Mic stage — outer rings pulse ambiently, the glow/ring-live/
                circle scale live with real mic amplitude (see drawFrame) */}
            <div className={`stt-mic-stage stt-${uiState}`}>
              <div className="stt-ring stt-ring-1" />
              <div className="stt-ring stt-ring-2" />
              <div className="stt-ring stt-ring-3" />
              <div ref={liveRingRef} className="stt-ring-live" />
              <div ref={micGlowRef} className="stt-mic-glow" />
              <button
                ref={micCircleRef}
                className={`stt-mic-circle ${uiState === 'error' ? 'stt-error-state' : ''}`}
                onClick={handleMicTap}
                onPointerDown={(e) => e.stopPropagation()}
                title={uiState === 'error' ? 'Retry' : 'Microphone'}
              >
                {uiState === 'error' ? (
                  <AlertTriangle size={30} />
                ) : uiState === 'processing' ? (
                  <Mic size={30} className="stt-mic-icon-spin" style={{ opacity: 0.6 }} />
                ) : (
                  <Mic size={30} />
                )}
              </button>
            </div>

            {/* Status */}
            <p className={`stt-status ${uiState === 'error' ? 'stt-status-error' : ''}`}>
              {statusText}
            </p>
            {uiState === 'idle' && (
              <p className="stt-hint">Speak naturally — I'll capture every word</p>
            )}
            {uiState === 'error' && (
              <button className="stt-retry-btn" onClick={handleMicTap}>
                <RotateCcw size={14} />
                Try again
              </button>
            )}

            {/* Live transcript preview */}
            {(uiState === 'listening' || uiState === 'processing') && hasSpeech && (
              <div ref={transcriptRef} className="stt-transcript" onPointerDown={(e) => e.stopPropagation()}>
                {finalText}
                {interimText && (
                  <span className="stt-transcript-interim">
                    {finalText ? ' ' : ''}{interimText}
                  </span>
                )}
              </div>
            )}

            {/* Waveform */}
            {uiState !== 'error' && (
              <div className={`stt-wave-row ${uiState === 'listening' ? 'stt-wave-active' : ''}`}>
                <canvas ref={canvasRef} className="stt-canvas" />
              </div>
            )}

            {/* Controls */}
            <div className="stt-controls">
              <button className="stt-btn stt-btn-cancel" onClick={handleCancel}>
                <X size={17} strokeWidth={2.5} />
                Cancel
              </button>
              <button
                className="stt-btn stt-btn-done"
                onClick={handleDone}
                disabled={uiState === 'error'}
              >
                <Check size={17} strokeWidth={2.5} />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
