import { useState, useEffect, useMemo, useCallback } from 'react';

interface HomeScreenProps {
  onPromptSelect: (text: string) => void;
  onConversationSelect: (id: string) => void;
  user: any;
}

// ─── Suggestion cards ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    icon: '✦',
    label: 'Summarise',
    prompt: 'Summarise the key points from this article and highlight the most important takeaways:',
    color: '#a78bfa',
  },
  {
    icon: '◈',
    label: 'Write',
    prompt: 'Write a concise and compelling professional email about:',
    color: '#38bdf8',
  },
  {
    icon: '⌬',
    label: 'Analyse',
    prompt: 'Analyse the pros and cons of the following and give me a structured breakdown:',
    color: '#34d399',
  },
  {
    icon: '⬡',
    label: 'Brainstorm',
    prompt: 'Brainstorm 10 creative and unconventional ideas for:',
    color: '#fb923c',
  },
  {
    icon: '◎',
    label: 'Debug',
    prompt: 'Review this code, find the bugs, and explain how to fix them:\n\n```\n\n```',
    color: '#f472b6',
  },
  {
    icon: '◉',
    label: 'Explain',
    prompt: 'Explain this concept simply, as if I have no prior knowledge:',
    color: '#facc15',
  },
];

// ─── Animated background orbs ─────────────────────────────────────────────────
const BackgroundOrbs = () => (
  <div aria-hidden="true" style={{
    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
  }}>
    <div style={{
      position: 'absolute', top: '-10%', left: '15%',
      width: 520, height: 520, borderRadius: '50%',
      background: 'radial-gradient(circle, hsl(var(--primary) / 0.07) 0%, transparent 70%)',
      animation: 'hs-float 12s ease-in-out infinite',
      filter: 'blur(1px)',
    }} />
    <div style={{
      position: 'absolute', bottom: '5%', right: '10%',
      width: 380, height: 380, borderRadius: '50%',
      background: 'radial-gradient(circle, hsl(260 80% 65% / 0.06) 0%, transparent 70%)',
      animation: 'hs-float 16s ease-in-out infinite reverse',
      filter: 'blur(1px)',
    }} />
    <div style={{
      position: 'absolute', top: '40%', right: '25%',
      width: 200, height: 200, borderRadius: '50%',
      background: 'radial-gradient(circle, hsl(200 80% 60% / 0.05) 0%, transparent 70%)',
      animation: 'hs-float 9s ease-in-out infinite 2s',
    }} />
    {/* Subtle grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(hsl(var(--foreground) / 0.022) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--foreground) / 0.022) 1px, transparent 1px)
      `,
      backgroundSize: '48px 48px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)',
    }} />
  </div>
);

// ─── Brand splash ─────────────────────────────────────────────────────────────
const BrandSplash = ({ fadeOut }: { fadeOut: boolean }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'hsl(var(--background))',
    opacity: fadeOut ? 0 : 1,
    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: fadeOut ? 'none' : 'all',
  }}>
    <style>{`
      @keyframes hs-logo-in {
        from { opacity: 0; transform: scale(0.88) translateY(12px); filter: blur(6px); }
        to   { opacity: 1; transform: scale(1) translateY(0);     filter: blur(0); }
      }
      @keyframes hs-sub-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes hs-bar {
        from { width: 0%; }
        to   { width: 100%; }
      }
    `}</style>

    {/* Glow ring */}
    <div style={{
      position: 'relative', width: 80, height: 80, marginBottom: 24,
      animation: 'hs-logo-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
    }}>
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(260 80% 65%), hsl(var(--primary)))',
        opacity: 0.25, filter: 'blur(10px)',
        animation: 'hs-float 4s ease-in-out infinite',
      }} />
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'hsl(var(--primary) / 0.1)',
        border: '1.5px solid hsl(var(--primary) / 0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, backdropFilter: 'blur(8px)',
        boxShadow: '0 0 32px hsl(var(--primary) / 0.2)',
      }}>
        ✦
      </div>
    </div>

    <h1 style={{
      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
      fontWeight: 800,
      letterSpacing: '-0.04em',
      color: 'hsl(var(--foreground))',
      animation: 'hs-logo-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
      margin: 0,
      lineHeight: 1,
    }}>
      SanGPT
    </h1>

    <p style={{
      fontSize: '1rem',
      color: 'hsl(var(--muted-foreground))',
      marginTop: 10,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      fontWeight: 400,
      animation: 'hs-sub-in 0.5s ease both 0.35s',
    }}>
      Your AI Assistant
    </p>

    {/* Loading bar */}
    <div style={{
      marginTop: 40, width: 120, height: 2,
      background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden',
      animation: 'hs-sub-in 0.4s ease both 0.5s',
    }}>
      <div style={{
        height: '100%', borderRadius: 2,
        background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(260 80% 65%))',
        animation: 'hs-bar 1.0s cubic-bezier(0.4, 0, 0.2, 1) both 0.4s',
      }} />
    </div>
  </div>
);

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export const HomeScreen = ({ onPromptSelect, onConversationSelect, user }: HomeScreenProps) => {
  const [showBrand, setShowBrand] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [visibleCards, setVisibleCards] = useState(false);

  // Brand intro — once per session
  useEffect(() => {
    const seen = sessionStorage.getItem('sangpt-brand-intro');
    if (seen) { setShowBrand(false); setVisibleCards(true); return; }
    const t1 = setTimeout(() => setFadeOut(true), 1400);
    const t2 = setTimeout(() => {
      setShowBrand(false);
      sessionStorage.setItem('sangpt-brand-intro', '1');
      setTimeout(() => setVisibleCards(true), 100);
    }, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
    const nameStr = name ? `, ${name}` : '';
    if (hour >= 5 && hour < 12) return `Good morning${nameStr}`;
    if (hour >= 12 && hour < 17) return `Good afternoon${nameStr}`;
    return `Good evening${nameStr}`;
  }, [user]);

  const subline = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Ready to start something great?";
    if (hour >= 12 && hour < 17) return "What can we figure out together?";
    return "Let's get to work.";
  }, []);

  const handleCardClick = useCallback((prompt: string) => {
    onPromptSelect(prompt);
  }, [onPromptSelect]);

  return (
    <>
      <style>{`
        @keyframes hs-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes hs-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hs-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .hs-card {
          position: relative;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          padding: 18px 20px;
          cursor: pointer;
          text-align: left;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.2s ease,
                      box-shadow 0.2s ease;
          overflow: hidden;
        }
        .hs-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: inherit;
        }
        .hs-card:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px hsl(var(--primary) / 0.15);
          border-color: hsl(var(--primary) / 0.3);
        }
        .hs-card:hover::before { opacity: 1; }
        .hs-card:active { transform: translateY(-1px) scale(1.008); }
        .hs-card:focus-visible {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .hs-card, .hs-card:hover { transform: none; }
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Brand splash overlay */}
      {showBrand && <BrandSplash fadeOut={fadeOut} />}

      {/* Main content */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', width: '100%',
        padding: '0 16px',
        overflow: 'hidden',
      }}>
        <BackgroundOrbs />

        {/* Hero text */}
        <div style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center',
          maxWidth: 560,
          opacity: visibleCards ? 1 : 0,
          animation: visibleCards ? 'hs-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both' : 'none',
          marginBottom: 40,
        }}>
          {/* Wordmark */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'hsl(var(--primary) / 0.12)',
              border: '1px solid hsl(var(--primary) / 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              boxShadow: '0 0 16px hsl(var(--primary) / 0.15)',
            }}>
              ✦
            </div>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted-foreground))',
            }}>
              SanGPT
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.9rem, 5vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'hsl(var(--foreground))',
            margin: '0 0 10px',
          }}>
            {greeting}
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'hsl(var(--muted-foreground))',
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            {subline}
          </p>
        </div>

        {/* Suggestion cards */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: 10,
          width: '100%',
          maxWidth: 660,
        }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.label}
              className="hs-card"
              onClick={() => handleCardClick(s.prompt)}
              tabIndex={0}
              aria-label={`Start a ${s.label.toLowerCase()} prompt`}
              style={{
                opacity: visibleCards ? 1 : 0,
                animation: visibleCards
                  ? `hs-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both ${0.08 + i * 0.055}s`
                  : 'none',
                fontFamily: 'inherit',
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Glow accent on hover */}
              {hoveredCard === i && (
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0, borderRadius: 'inherit',
                  background: `radial-gradient(circle at 30% 50%, ${s.color}14 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Icon */}
              <div style={{
                fontSize: 20,
                color: s.color,
                marginBottom: 8,
                display: 'block',
                lineHeight: 1,
                filter: hoveredCard === i ? `drop-shadow(0 0 8px ${s.color}80)` : 'none',
                transition: 'filter 0.2s ease',
              }}>
                {s.icon}
              </div>

              {/* Label */}
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                marginBottom: 3,
                letterSpacing: '-0.01em',
              }}>
                {s.label}
              </div>

              {/* Prompt preview */}
              <div style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.45,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
              }}>
                {s.prompt.slice(0, 55)}{s.prompt.length > 55 ? '…' : ''}
              </div>
            </button>
          ))}
        </div>

        {/* Bottom hint */}
        <p style={{
          position: 'relative', zIndex: 1,
          marginTop: 28,
          fontSize: '0.75rem',
          color: 'hsl(var(--muted-foreground) / 0.5)',
          letterSpacing: '0.02em',
          opacity: visibleCards ? 1 : 0,
          animation: visibleCards ? 'hs-fade-in 0.6s ease both 0.55s' : 'none',
        }}>
          Or type anything below ↓
        </p>
      </div>
    </>
  );
};
