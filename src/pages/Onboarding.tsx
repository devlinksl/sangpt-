import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAlert } from '@/hooks/useAlert';
import { humanizeError } from '@/lib/humanizeError';

type View =
  | 'welcome'
  | 'method'
  | 'signin'
  | 'forgot'
  | 'signup-name'
  | 'signup-username'
  | 'signup-dob'
  | 'signup-email'
  | 'signup-password';

const SIGNUP_STEPS: View[] = [
  'signup-name',
  'signup-username',
  'signup-dob',
  'signup-email',
  'signup-password',
];

export const Onboarding = () => {
  const { alert } = useAlert();
  const [view, setView] = useState<View>('welcome');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const stepIndex = SIGNUP_STEPS.indexOf(view);
  const isSignupStep = stepIndex >= 0;
  const totalSteps = SIGNUP_STEPS.length;

  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (e: any) {
      alert({ title: 'Sign in failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      alert({ title: 'Sign in failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert({ title: 'Check your email', description: 'We sent you a reset link.', variant: 'success' });
      setView('signin');
    } catch (e: any) {
      alert({ title: 'Could not send email', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert({ title: 'Passwords don\'t match', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            username,
            date_of_birth: dob,
            display_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });
      if (error) throw error;
      alert({ title: 'Welcome to SanGPT', description: 'Check your email to verify.', variant: 'success' });
    } catch (e: any) {
      alert({ title: 'Sign up failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const next = () => {
    const i = SIGNUP_STEPS.indexOf(view);
    if (i < SIGNUP_STEPS.length - 1) setView(SIGNUP_STEPS[i + 1]);
    else handleSignUp();
  };
  const back = () => {
    const i = SIGNUP_STEPS.indexOf(view);
    if (i > 0) setView(SIGNUP_STEPS[i - 1]);
    else setView('method');
  };

  const stepValid = (() => {
    switch (view) {
      case 'signup-name': return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 'signup-username': return /^[a-zA-Z0-9_]{3,20}$/.test(username);
      case 'signup-dob': return !!dob;
      case 'signup-email': return /^\S+@\S+\.\S+$/.test(email);
      case 'signup-password': return password.length >= 6 && confirmPassword === password;
      default: return false;
    }
  })();

  const Header = ({ onBack, title }: { onBack: () => void; title?: string }) => (
    <div className="flex items-center h-14 px-2">
      <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      {title && <h2 className="flex-1 text-center text-base font-medium pr-10">{title}</h2>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* top progress for signup */}
      {isSignupStep && (
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {SIGNUP_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-foreground' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Step {stepIndex + 1} of {totalSteps}
          </div>
        </div>
      )}

      {view === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-12 animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl animate-pulse" />
              <h1 className="relative text-6xl font-bold tracking-tight">SanGPT</h1>
            </div>
            <h2 className="text-2xl font-semibold mt-4">Welcome to SanGPT</h2>
            <p className="text-muted-foreground mt-3 max-w-xs">
              A faster, smarter, more personal AI assistant — built for everything you create.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <Button
              onClick={() => oauth('google')}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-full text-base border-2"
            >
              Continue with Google
            </Button>
            <Button
              onClick={() => oauth('apple')}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-full text-base border-2"
            >
              Continue with Apple
            </Button>
            <Button
              onClick={() => setView('method')}
              className="w-full h-14 rounded-full text-base bg-foreground text-background hover:bg-foreground/90"
            >
              Use Email
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              By continuing, you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {view === 'method' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <Header onBack={() => setView('welcome')} />
          <div className="flex-1 flex flex-col justify-between px-6 pb-12">
            <div className="text-center pt-8">
              <h2 className="text-3xl font-semibold">Get started with email</h2>
              <p className="text-muted-foreground mt-2">Sign in or create a new account</p>
            </div>
            <div className="space-y-3 max-w-sm w-full mx-auto">
              <Button
                onClick={() => setView('signup-name')}
                className="w-full h-14 rounded-full text-base bg-foreground text-background hover:bg-foreground/90"
              >
                Sign Up
              </Button>
              <Button
                onClick={() => setView('signin')}
                variant="outline"
                className="w-full h-14 rounded-full text-base border-2"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'signin' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <Header onBack={() => setView('method')} title="Sign In" />
          <form onSubmit={handleSignIn} className="flex-1 flex flex-col px-6 pb-8 max-w-sm w-full mx-auto">
            <div className="flex-1 space-y-5 pt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPwd ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => setView('forgot')} className="text-sm text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full bg-foreground text-background hover:bg-foreground/90">
              {loading ? 'Signing in…' : 'Continue'}
            </Button>
          </form>
        </div>
      )}

      {view === 'forgot' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <Header onBack={() => setView('signin')} title="Reset password" />
          <form onSubmit={handleForgot} className="flex-1 flex flex-col px-6 pb-8 max-w-sm w-full mx-auto">
            <div className="flex-1 space-y-5 pt-4">
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="you@example.com" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full bg-foreground text-background hover:bg-foreground/90">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </div>
      )}

      {isSignupStep && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <Header onBack={back} title="Create account" />
          <div className="flex-1 flex flex-col px-6 pb-8 max-w-sm w-full mx-auto">
            <div className="flex-1 pt-4 space-y-5">
              {view === 'signup-name' && (
                <>
                  <h3 className="text-2xl font-semibold">What's your name?</h3>
                  <div className="space-y-2"><Label>First name</Label>
                    <Input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2"><Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </>
              )}
              {view === 'signup-username' && (
                <>
                  <h3 className="text-2xl font-semibold">Pick a username</h3>
                  <p className="text-sm text-muted-foreground">3–20 characters. Letters, numbers and underscores.</p>
                  <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="h-12 rounded-xl" placeholder="username" />
                </>
              )}
              {view === 'signup-dob' && (
                <>
                  <h3 className="text-2xl font-semibold">When's your birthday?</h3>
                  <p className="text-sm text-muted-foreground">We use this to personalize your experience.</p>
                  <Input autoFocus type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 rounded-xl" />
                </>
              )}
              {view === 'signup-email' && (
                <>
                  <h3 className="text-2xl font-semibold">Your email</h3>
                  <Input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="you@example.com" />
                </>
              )}
              {view === 'signup-password' && (
                <>
                  <h3 className="text-2xl font-semibold">Create a password</h3>
                  <p className="text-sm text-muted-foreground">At least 6 characters.</p>
                  <div className="relative">
                    <Input autoFocus type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pr-10" placeholder="Password" />
                    <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Input type={showPwd ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl" placeholder="Confirm password" />
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={next}
              disabled={!stepValid || loading}
              className="w-full h-14 rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? 'Creating account…' : view === 'signup-password' ? 'Create account' : 'Continue'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
