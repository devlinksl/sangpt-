import { useMemo } from 'react';

interface HomeScreenProps {
  onPromptSelect?: (text: string) => void;
  onConversationSelect?: (id: string) => void;
  user?: any;
}

// HomeScreen: greeting, fixed subline ("Let's get to work."), and the app logo.
// Logo lives at public/home-logo.png, so it's referenced as "/home-logo.png".
// Includes a subtle fade + rise entrance animation (logo leads, text follows).
export const HomeScreen = ({ user }: HomeScreenProps) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
    const nameStr = name ? `, ${name}` : '';
    if (hour >= 5 && hour < 12) return `Good morning${nameStr}`;
    if (hour >= 12 && hour < 17) return `Good afternoon${nameStr}`;
    return `Good evening${nameStr}`;
  }, [user]);

  const subline = "Let's get to work.";

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: 24,
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
        .home-logo {
          animation: home-logo-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .home-greeting {
          animation: home-text-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }
        .home-subline {
          animation: home-text-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .home-logo, .home-greeting, .home-subline {
            animation: none;
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
          width: 112,
          height: 112,
          objectFit: 'contain',
          marginBottom: 24,
        }}
      />

      <h1
        className="home-greeting"
        style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          margin: 0,
          color: 'hsl(var(--foreground))',
        }}
      >
        {greeting}
      </h1>

      <p
        className="home-subline"
        style={{
          marginTop: 12,
          fontSize: '1.05rem',
          color: 'hsl(var(--muted-foreground))',
          margin: 0,
        }}
      >
        {subline}
      </p>
    </div>
  );
};
