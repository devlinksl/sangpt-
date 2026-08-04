import { useMemo } from 'react';

interface HomeScreenProps {
  onPromptSelect?: (text: string) => void;
  onConversationSelect?: (id: string) => void;
  user?: any;
}

// Simplified HomeScreen: only greeting, a fixed subline ("Let's get to work."),
// and an image placeholder. No splash, no animations, no suggestion cards.
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      padding: 24,
      boxSizing: 'border-box',
      textAlign: 'center',
    }}>
      {/* Image placeholder */}
      <div
        aria-label="image-placeholder"
        style={{
          width: 160,
          height: 160,
          borderRadius: 12,
          background: 'hsl(var(--muted-foreground) / 0.08)',
          border: '1px dashed hsl(var(--muted-foreground) / 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--muted-foreground))',
          marginBottom: 20,
        }}
      >
        Image placeholder
      </div>

      <h1 style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
        fontWeight: 800,
        margin: 0,
        color: 'hsl(var(--foreground))',
      }}>
        {greeting}
      </h1>

      <p style={{
        marginTop: 12,
        fontSize: '1.05rem',
        color: 'hsl(var(--muted-foreground))',
        margin: 0,
      }}>
        {subline}
      </p>
    </div>
  );
};
