import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  X,
  ChevronDown,
  Gauge,
  Mic2,
  Download,
  Share2,
  Volume2,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAlert } from '@/hooks/useAlert';

/* ──────────────────────────────────────────────────────────────
   Speech engine (Web Speech API) with word-accurate progress
   ────────────────────────────────────────────────────────────── */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const WORDS_PER_SECOND = 2.9; // baseline at 1x, used for duration estimates

interface SpeechPlayerState {
  speak: (text: string) => void;
  isActive: boolean;
  isPlaying: boolean;
}

const SpeechPlayerContext = createContext<SpeechPlayerState | null>(null);

export const useSpeechPlayer = () => {
  const ctx = useContext(SpeechPlayerContext);
  if (!ctx) throw new Error('useSpeechPlayer must be used within SpeechPlayerProvider');
  return ctx;
};

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const SpeechPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const { alert } = useAlert();

  const [text, setText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [charOffset, setCharOffset] = useState(0); // absolute char position spoken
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>('');
  const [showVoices, setShowVoices] = useState(false);

  const startCharRef = useRef(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tickRef = useRef<number | null>(null);

  const totalWords = useMemo(() => (text.match(/\S+/g) ?? []).length, [text]);
  const duration = useMemo(
    () => Math.max(1, totalWords / (WORDS_PER_SECOND * rate)),
    [totalWords, rate]
  );
  const progress = text.length ? Math.min(1, charOffset / text.length) : 0;
  const elapsed = duration * progress;

  /* ── voices ── */
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      const all = list.length ? list : window.speechSynthesis.getVoices();
      setVoices(all);
      setVoiceName((prev) => prev || all[0]?.name || '');
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const clearTick = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopEngine = useCallback(() => {
    clearTick();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utterRef.current = null;
    setIsPlaying(false);
  }, []);

  /* ── start speaking from a character offset ── */
  const speakFrom = useCallback(
    (source: string, fromChar: number) => {
      if (!('speechSynthesis' in window)) {
        alert({
          title: 'Not supported',
          description: 'Speech playback is not available on this device.',
          variant: 'destructive',
        });
        return;
      }

      window.speechSynthesis.cancel();
      clearTick();

      const safeFrom = Math.max(0, Math.min(fromChar, Math.max(0, source.length - 1)));
      startCharRef.current = safeFrom;
      setCharOffset(safeFrom);

      const utter = new SpeechSynthesisUtterance(source.slice(safeFrom));
      utter.rate = rate;
      utter.pitch = 1;
      const voice = voices.find((v) => v.name === voiceName);
      if (voice) utter.voice = voice;

      utter.onboundary = (e) => {
        if (typeof e.charIndex === 'number') {
          setCharOffset(startCharRef.current + e.charIndex);
        }
      };
      utter.onend = () => {
        setCharOffset(source.length);
        setIsPlaying(false);
        clearTick();
      };
      utter.onerror = () => {
        setIsPlaying(false);
        clearTick();
      };

      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
      setIsPlaying(true);

      // Fallback progress ticker for engines without boundary events
      const charsPerSecond = (source.length / Math.max(1, source.length / 5)) * 0; // noop guard
      void charsPerSecond;
      tickRef.current = window.setInterval(() => {
        setCharOffset((prev) => {
          if (!window.speechSynthesis.speaking) return prev;
          const step = (source.length / duration) * 0.25;
          return Math.min(source.length, prev + step * 0.25);
        });
      }, 250);
    },
    [alert, duration, rate, voiceName, voices]
  );

  const speak = useCallback(
    (next: string) => {
      const clean = next.trim();
      if (!clean) return;
      setText(clean);
      setIsActive(true);
      setMinimized(false);
      setCharOffset(0);
      speakFrom(clean, 0);
    },
    [speakFrom]
  );

  const togglePlay = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      clearTick();
      return;
    }
    if (window.speechSynthesis.paused && utterRef.current) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }
    speakFrom(text, charOffset >= text.length ? 0 : charOffset);
  }, [charOffset, isPlaying, speakFrom, text]);

  const seekSeconds = useCallback(
    (delta: number) => {
      const ratio = Math.min(1, Math.max(0, (elapsed + delta) / duration));
      speakFrom(text, Math.floor(ratio * text.length));
    },
    [duration, elapsed, speakFrom, text]
  );

  const seekToRatio = useCallback(
    (ratio: number) => speakFrom(text, Math.floor(ratio * text.length)),
    [speakFrom, text]
  );

  const cycleSpeed = useCallback(() => {
    const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    setRate(next);
  }, [rate]);

  // Restart with new rate/voice while playing
  useEffect(() => {
    if (isActive && isPlaying) speakFrom(text, charOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, voiceName]);

  useEffect(() => () => stopEngine(), [stopEngine]);

  const close = useCallback(() => {
    stopEngine();
    setIsActive(false);
    setMinimized(false);
    setCharOffset(0);
  }, [stopEngine]);

  const download = useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sangpt-narration.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  const share = useCallback(async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        alert({ title: 'Copied', description: 'Narration text copied.', variant: 'success' });
      }
    } catch {
      /* user cancelled */
    }
  }, [alert, text]);

  const value = useMemo(
    () => ({ speak, isActive, isPlaying }),
    [speak, isActive, isPlaying]
  );

  return (
    <SpeechPlayerContext.Provider value={value}>
      {children}

      {/* ─── Mini player ─── */}
      {isActive && minimized && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] left-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2 shadow-[0_10px_30px_hsl(0_0%_0%/0.18)] animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => setMinimized(false)}>
              <p className="truncate text-xs font-medium">{text.slice(0, 60)}</p>
              <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </button>
            <button
              onClick={close}
              aria-label="Close player"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Full bottom sheet ─── */}
      {isActive && !minimized && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={() => setMinimized(true)}
          />
          <div
            className="relative w-full max-w-md rounded-t-[26px] border border-border bg-background pb-[calc(env(safe-area-inset-bottom,0px)+18px)] shadow-[0_-16px_40px_hsl(0_0%_0%/0.22)] animate-in slide-in-from-bottom duration-250"
            role="dialog"
            aria-label="Listen"
          >
            {/* grabber / header */}
            <div className="flex items-center justify-between px-4 pt-3">
              <button
                onClick={() => setMinimized(true)}
                aria-label="Minimize"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <ChevronDown size={18} />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground">
                <Volume2 size={13} /> Listening
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <X size={17} />
              </button>
            </div>

            {/* text preview */}
            <div className="px-6 pt-2">
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>

            {/* seek bar */}
            <div className="px-6 pt-5">
              <Slider
                value={[progress * 100]}
                max={100}
                step={0.5}
                onValueChange={(v) => setCharOffset((v[0] / 100) * text.length)}
                onValueCommit={(v) => seekToRatio(v[0] / 100)}
              />
              <div className="mt-2 flex justify-between text-[11px] tabular-nums text-muted-foreground">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* transport */}
            <div className="flex items-center justify-center gap-7 px-6 pt-4">
              <button
                onClick={() => seekSeconds(-10)}
                aria-label="Rewind 10 seconds"
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-accent active:scale-95 transition-transform"
              >
                <Rewind size={20} />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(0_0%_0%/0.18)] active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={() => seekSeconds(10)}
                aria-label="Forward 10 seconds"
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-accent active:scale-95 transition-transform"
              >
                <FastForward size={20} />
              </button>
            </div>

            {/* options */}
            <div className="mt-5 grid grid-cols-4 gap-2 border-t border-border px-4 pt-3">
              <button
                onClick={cycleSpeed}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-muted-foreground hover:bg-accent"
              >
                <Gauge size={17} />
                {rate}x
              </button>
              <button
                onClick={() => setShowVoices((v) => !v)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-muted-foreground hover:bg-accent"
              >
                <Mic2 size={17} />
                Voice
              </button>
              <button
                onClick={download}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-muted-foreground hover:bg-accent"
              >
                <Download size={17} />
                Save
              </button>
              <button
                onClick={share}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-muted-foreground hover:bg-accent"
              >
                <Share2 size={17} />
                Share
              </button>
            </div>

            {/* voice picker */}
            {showVoices && (
              <div className="max-h-44 overflow-y-auto px-4 pt-2 smooth-scroll">
                {voices.length === 0 && (
                  <p className="px-2 py-3 text-xs text-muted-foreground">No voices available.</p>
                )}
                {voices.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      setVoiceName(v.name);
                      setShowVoices(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-accent ${
                      v.name === voiceName ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    <span className="truncate">{v.name}</span>
                    <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">{v.lang}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SpeechPlayerContext.Provider>
  );
};
