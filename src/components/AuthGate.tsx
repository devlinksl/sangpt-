import { useAuth } from './AuthContext';
import { Onboarding } from '@/pages/Onboarding';

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // No loading screen: while the session resolves we render nothing at all,
  // so the chat UI appears the moment auth is known (usually the first frame).
  if (loading) return null;
  if (!user) return <Onboarding />;
  return <>{children}</>;
};
