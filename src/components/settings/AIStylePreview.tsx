import { Check } from 'lucide-react';

const STYLES = [
  { key: 'chatgpt',  label: 'ChatGPT',     family: 'system-ui, sans-serif', accent: 'hsl(150 60% 45%)' },
  { key: 'gemini',   label: 'Gemini',      family: 'system-ui, sans-serif', accent: 'hsl(220 90% 60%)' },
  { key: 'claude',   label: 'Claude',      family: 'Georgia, serif',        accent: 'hsl(20 80% 55%)'  },
  { key: 'dev',      label: 'Developer',   family: 'ui-monospace, monospace', accent: 'hsl(280 70% 60%)' },
  { key: 'minimal',  label: 'Minimal',     family: 'system-ui, sans-serif', accent: 'hsl(0 0% 50%)'    },
  { key: 'edu',      label: 'Educational', family: 'system-ui, sans-serif', accent: 'hsl(40 90% 55%)'  },
  { key: 'creative', label: 'Creative',    family: '"Comic Sans MS", system-ui, sans-serif', accent: 'hsl(330 80% 60%)' },
] as const;

interface Props {
  current: string;
  onSelect: (key: string) => void;
}

export function AIStylePreview({ current, onSelect }: Props) {
  return (
    <div className="space-y-1">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 mb-2">
        Live Preview
      </h3>
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
          {STYLES.map((s) => {
            const active = s.key === current;
            return (
              <button
                key={s.key}
                onClick={() => onSelect(s.key)}
                className={`relative flex-shrink-0 w-44 rounded-2xl border text-left transition-all active:scale-[0.97] ${
                  active
                    ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]'
                    : 'border-border/40 hover:border-border'
                }`}
                style={{
                  background: 'hsl(var(--card) / 0.6)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {active && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="p-3 space-y-2" style={{ fontFamily: s.family }}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.accent }}
                    />
                    <span className="text-[11px] font-semibold tracking-wide">
                      {s.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold leading-tight" style={{ color: s.accent }}>
                    Sample heading
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-foreground/30 w-full" />
                    <div className="h-1.5 rounded-full bg-foreground/20 w-5/6" />
                    <div className="h-1.5 rounded-full bg-foreground/15 w-4/6" />
                  </div>
                  <div
                    className="text-[9px] rounded px-1.5 py-1 mt-1"
                    style={{
                      background: 'hsl(var(--muted) / 0.6)',
                      fontFamily: s.key === 'dev' ? 'ui-monospace, monospace' : undefined,
                    }}
                  >
                    {s.key === 'dev' ? 'const x = 1;' : '• bullet item'}
                  </div>
                </div>
                <div className="px-3 pb-2.5 text-[10px] text-muted-foreground">
                  Tap to apply
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
