import { useAuth } from './AuthContext';
import { Onboarding } from '@/pages/Onboarding';
import { useEffect, useState } from 'react';

const SplashScreen = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl animate-pulse" />
      <h1 className="relative text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent animate-fade-in">
        SanGPT
      </h1>
    </div>
    <p className="mt-3 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '120ms' }}>
      Your AI Assistant
    </p>
    <div className="mt-8 flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  // Hold the splash for a tiny minimum so it never just flashes
  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 450);
    return () => clearTimeout(t);
  }, []);

  if (loading || !minDone) return <SplashScreen />;
  if (!user) return <Onboarding />;
  return <>{children}</>;
};
