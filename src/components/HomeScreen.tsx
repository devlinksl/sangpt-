import { useMemo } from 'react';

interface HomeScreenProps {
  onPromptSelect?: (text: string) => void;
  onConversationSelect?: (id: string) => void;
  user?: any;
}

// HomeScreen: time-aware greeting + a randomly-picked casual subline, plus the app logo.
// Logo lives at public/home-logo.png, so it's referenced as "/home-logo.png".
// Includes a subtle fade + rise entrance animation (logo leads, text follows)
// and a slow continuous "breathing" pulse on the logo.
// A few variants per time-of-day so the greeting doesn't feel static.
// One is picked at random on each load.
const GREETINGS = {
  morning: ['Good morning', 'Morning', 'Rise and shine'],
  afternoon: ['Good afternoon', 'Hope your day is going well'],
  evening: ['Good evening', 'Evening', 'Winding down?'],
};

// Casual, tone-matched sublines. One is picked at random on each load,
// independent of the greeting/time of day.
const SUBLINES = [
  "Ready when you are.",
  "What are we building today?",
  "Let's make something.",
  "Where should we start?",
  "What's on your mind?",
];

const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const HomeScreen = ({ user }: HomeScreenProps) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
    const nameStr = name ? `, ${name}` : '';

    const bucket = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : 'evening';
    const base = pickRandom(GREETINGS[bucket]);
    return `${base}${nameStr}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const subline = useMemo(() => pickRandom(SUBLINES), []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 0,
        width: '100%',
        padding: '24px 24px 0',
        // Optical centering: the composer sits below this area, so a purely
        // geometric centre reads as sitting too low. Lift the block slightly.
        paddingBottom: 'clamp(24px, 9vh, 96px)',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      {/* Scoped keyframes — no Tailwind config or global CSS changes required */}
      <style>{`
        @keyframes home-logo-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes home-text-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-logo-pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 hsl(var(--foreground) / 0));
          }
          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 16px hsl(var(--foreground) / 0.18));
          }
        }
        .home-logo {
          animation:
            home-logo-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both,
            home-logo-pulse 3.2s ease-in-out 0.6s infinite;
        }
        .home-greeting {
          animation: home-text-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }
        .home-subline {
          animation: home-text-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .home-logo, .home-greeting, .home-subline {
            animation: none !important;
          }
        }
      `}</style>

      <img
        src="/home-logo.png"
        alt="App logo"
        width={112}
        height={112}
        className="home-logo"
        style={{
          width: 104,
          height: 104,
          objectFit: 'contain',
          marginBottom: 18,
        }}
      />

      <h1
        className="home-greeting"
        style={{
          fontSize: 'clamp(1.6rem, 7vw, 2.25rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: 0,
          textWrap: 'balance',
          color: 'hsl(var(--foreground))',
        }}
      >
        {greeting}
      </h1>

      <p
        className="home-subline"
        style={{
          margin: '10px 0 0',
          fontSize: '1rem',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        {subline}
      </p>
    </div>
  );
};
