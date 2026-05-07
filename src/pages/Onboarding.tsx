import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAlert } from '@/hooks/useAlert';
import { humanizeError } from '@/lib/humanizeError';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  /* ── Root ── */
  .ob-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100dvh;
    background: hsl(var(--background));
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* ── Ambient background orbs ── */
  .ob-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(80px);
    opacity: 0.18;
    transition: all 1.8s cubic-bezier(0.4,0,0.2,1);
  }
  .ob-orb-1 {
    width: 420px; height: 420px;
    background: hsl(var(--primary));
    top: -120px; left: -80px;
    animation: ob-drift-1 12s ease-in-out infinite alternate;
  }
  .ob-orb-2 {
    width: 300px; height: 300px;
    background: hsl(var(--primary) / 0.6);
    bottom: 60px; right: -60px;
    animation: ob-drift-2 15s ease-in-out infinite alternate;
  }
  .ob-orb-3 {
    width: 180px; height: 180px;
    background: hsl(var(--primary) / 0.4);
    top: 40%; left: 50%;
    transform: translate(-50%, -50%);
    animation: ob-drift-3 10s ease-in-out infinite alternate;
    opacity: 0.08;
  }

  @keyframes ob-drift-1 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(40px,60px) scale(1.15); }
  }
  @keyframes ob-drift-2 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(-30px,-40px) scale(1.1); }
  }
  @keyframes ob-drift-3 {
    from { transform: translate(-50%,-50%) scale(1); opacity: 0.08; }
    to   { transform: translate(-50%,-50%) scale(1.4); opacity: 0.04; }
  }

  /* Noise grain texture overlay */
  .ob-grain {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 180px;
  }

  /* All content above the bg effects */
  .ob-content {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── View entrance animation ── */
  .ob-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    animation: ob-enter 0.38s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes ob-enter {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── WELCOME SCREEN ── */
  .ob-welcome-hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 28px 32px;
    text-align: center;
    gap: 0;
  }

  /* Animated logo mark */
  .ob-logo-wrap {
    position: relative;
    margin-bottom: 36px;
  }
  .ob-logo-ring {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    border: 1px solid hsl(var(--primary) / 0.2);
    animation: ob-ring-spin 10s linear infinite;
  }
  .ob-logo-ring-2 {
    inset: -36px;
    border-color: hsl(var(--primary) / 0.08);
    animation: ob-ring-spin 18s linear infinite reverse;
  }
  @keyframes ob-ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .ob-logo-ring::before,
  .ob-logo-ring-2::before {
    content: '';
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: hsl(var(--primary));
    top: 50%; left: 0;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px hsl(var(--primary));
  }

  .ob-logo-mark {
    width: 80px; height: 80px;
    border-radius: 26px;
    background: hsl(var(--primary) / 0.1);
    border: 1px solid hsl(var(--primary) / 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    backdrop-filter: blur(12px);
  }
  .ob-logo-letters {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 28px;
    letter-spacing: -0.04em;
    background: linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.6));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .ob-wordmark {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 38px;
    letter-spacing: -0.04em;
    color: hsl(var(--foreground));
    line-height: 1;
    margin-bottom: 14px;
  }

  .ob-tagline {
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 300;
    color: hsl(var(--muted-foreground));
    line-height: 1.6;
    max-width: 260px;
    margin-bottom: 0;
  }

  /* Floating feature pills */
  .ob-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 24px;
  }
  .ob-pill {
    font-size: 11px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 999px;
    background: hsl(var(--primary) / 0.07);
    border: 1px solid hsl(var(--primary) / 0.18);
    color: hsl(var(--foreground) / 0.7);
    letter-spacing: 0.01em;
  }

  /* ── CTA buttons area ── */
  .ob-cta-area {
    padding: 0 24px 36px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    align-self: stretch;
  }

  /* Social auth button */
  .ob-social-btn {
    width: 100%;
    height: 54px;
    border-radius: 16px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
    position: relative;
    overflow: hidden;
  }
  .ob-social-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: hsl(var(--foreground) / 0);
    transition: background 0.15s ease;
  }
  .ob-social-btn:hover::before { background: hsl(var(--foreground) / 0.04); }
  .ob-social-btn:active { transform: scale(0.98); }
  .ob-social-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ob-social-icon {
    width: 20px; height: 20px;
    flex-shrink: 0;
  }

  /* Divider */
  .ob-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px 0;
  }
  .ob-divider-line {
    flex: 1;
    height: 1px;
    background: hsl(var(--border));
  }
  .ob-divider-text {
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  /* Primary CTA */
  .ob-primary-btn {
    width: 100%;
    height: 54px;
    border-radius: 16px;
    border: none;
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.15s ease, transform 0.12s ease;
    letter-spacing: -0.01em;
  }
  .ob-primary-btn:hover:not(:disabled) { opacity: 0.88; }
  .ob-primary-btn:active:not(:disabled) { transform: scale(0.98); }
  .ob-primary-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Ghost secondary */
  .ob-ghost-btn {
    width: 100%;
    height: 50px;
    border-radius: 14px;
    border: 1px solid hsl(var(--border));
    background: transparent;
    color: hsl(var(--foreground));
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .ob-ghost-btn:hover:not(:disabled) { background: hsl(var(--accent) / 0.5); }
  .ob-ghost-btn:active:not(:disabled) { transform: scale(0.98); }

  .ob-legal {
    font-size: 11px;
    color: hsl(var(--muted-foreground) / 0.6);
    text-align: center;
    line-height: 1.5;
  }

  /* ── HEADER BAR ── */
  .ob-header {
    display: flex;
    align-items: center;
    height: 58px;
    padding: 0 12px;
    position: relative;
  }
  .ob-back-btn {
    width: 40px; height: 40px;
    border-radius: 12px;
    border: 1px solid hsl(var(--border) / 0.6);
    background: hsl(var(--accent) / 0.3);
    color: hsl(var(--foreground));
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.12s ease;
    flex-shrink: 0;
  }
  .ob-back-btn:hover { background: hsl(var(--accent) / 0.6); }
  .ob-back-btn:active { transform: scale(0.9); }

  .ob-header-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: hsl(var(--foreground));
  }

  /* ── PROGRESS BAR ── */
  .ob-progress-wrap {
    padding: 16px 24px 0;
  }
  .ob-progress-track {
    height: 3px;
    background: hsl(var(--muted) / 0.5);
    border-radius: 999px;
    overflow: hidden;
  }
  .ob-progress-fill {
    height: 100%;
    background: hsl(var(--foreground));
    border-radius: 999px;
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  .ob-progress-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  .ob-progress-label {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .ob-step-dots {
    display: flex;
    gap: 4px;
  }
  .ob-step-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: hsl(var(--muted) / 0.5);
    transition: background 0.3s ease, transform 0.3s ease;
  }
  .ob-step-dot.done {
    background: hsl(var(--foreground));
  }
  .ob-step-dot.active {
    background: hsl(var(--foreground));
    transform: scale(1.35);
  }

  /* ── FORM AREA ── */
  .ob-form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 24px;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    align-self: stretch;
  }

  .ob-step-header {
    padding: 28px 0 24px;
  }
  .ob-step-title {
    font-family: 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: hsl(var(--foreground));
    line-height: 1.15;
    margin-bottom: 6px;
  }
  .ob-step-sub {
    font-size: 14px;
    color: hsl(var(--muted-foreground));
    line-height: 1.5;
  }

  .ob-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Floating label input */
  .ob-field {
    position: relative;
  }
  .ob-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: hsl(var(--muted-foreground));
    margin-bottom: 6px;
  }
  .ob-input-wrap {
    position: relative;
  }
  .ob-input {
    width: 100%;
    height: 52px;
    border-radius: 14px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--accent) / 0.2);
    color: hsl(var(--foreground));
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 0 16px;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    -webkit-appearance: none;
    appearance: none;
  }
  .ob-input:focus {
    border-color: hsl(var(--foreground) / 0.4);
    background: hsl(var(--accent) / 0.35);
    box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.06);
  }
  .ob-input::placeholder { color: hsl(var(--muted-foreground) / 0.5); }
  .ob-input.has-right { padding-right: 48px; }

  .ob-input-action {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.15s ease;
  }
  .ob-input-action:hover { color: hsl(var(--foreground)); }

  /* Password strength */
  .ob-pwd-strength {
    margin-top: 8px;
    display: flex;
    gap: 4px;
  }
  .ob-pwd-bar {
    flex: 1; height: 2px;
    border-radius: 999px;
    background: hsl(var(--muted) / 0.4);
    transition: background 0.3s ease;
  }
  .ob-pwd-bar.weak   { background: #f87171; }
  .ob-pwd-bar.medium { background: #fb923c; }
  .ob-pwd-bar.strong { background: #4ade80; }

  .ob-match-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    margin-top: 6px;
    color: #4ade80;
    font-weight: 500;
  }

  /* Forgot pwd link */
  .ob-link-btn {
    background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
    text-align: left;
  }
  .ob-link-btn:hover { color: hsl(var(--foreground)); }

  /* Sticky bottom CTA */
  .ob-bottom {
    padding: 20px 24px 32px;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    align-self: stretch;
  }

  /* Username validity feedback */
  .ob-username-hint {
    font-size: 11px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s ease;
  }
  .ob-username-hint.valid   { color: #4ade80; }
  .ob-username-hint.invalid { color: hsl(var(--muted-foreground) / 0.6); }

  /* Pulse dot for invalid */
  .ob-hint-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ob-hint-dot.valid   { background: #4ade80; }
  .ob-hint-dot.invalid { background: hsl(var(--muted-foreground) / 0.4); }
`;

// ─── Google SVG icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="ob-social-icon" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.000,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

// ─── Apple SVG icon ───────────────────────────────────────────────────────────
const AppleIcon = () => (
  <svg className="ob-social-icon" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// ─── Password strength util ───────────────────────────────────────────────────
function pwdStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd) && pwd.length >= 10) score++;
  return score as 0 | 1 | 2 | 3;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const Onboarding = () => {
  const { alert } = useAlert();
  const [view, setView]       = useState<View>('welcome');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [username, setUsername]             = useState('');
  const [dob, setDob]                       = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const stepIndex   = SIGNUP_STEPS.indexOf(view);
  const isSignupStep = stepIndex >= 0;
  const totalSteps  = SIGNUP_STEPS.length;
  const progress    = isSignupStep ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  const strength    = pwdStrength(password);

  // ── Auth handlers (all original logic) ──────────────────────────────────
  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
    } catch (e: any) {
      alert({ title: 'Sign in failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
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
      alert({ title: "Passwords don't match", description: 'Please try again.', variant: 'destructive' });
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
      case 'signup-name':     return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 'signup-username': return /^[a-zA-Z0-9_]{3,20}$/.test(username);
      case 'signup-dob':      return !!dob;
      case 'signup-email':    return /^\S+@\S+\.\S+$/.test(email);
      case 'signup-password': return password.length >= 6 && confirmPassword === password;
      default: return false;
    }
  })();

  // ── Sub-components ───────────────────────────────────────────────────────
  const BackHeader = ({ onBack, title }: { onBack: () => void; title?: string }) => (
    <div className="ob-header">
      <button className="ob-back-btn" onClick={onBack}>
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
      {title && <span className="ob-header-title">{title}</span>}
    </div>
  );

  const ProgressBar = () => (
    <div className="ob-progress-wrap">
      <div className="ob-progress-track">
        <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ob-progress-meta">
        <span className="ob-progress-label">Step {stepIndex + 1} of {totalSteps}</span>
        <div className="ob-step-dots">
          {SIGNUP_STEPS.map((_, i) => (
            <div
              key={i}
              className={`ob-step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const BottomCTA = ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <div className="ob-bottom">
      <button className="ob-primary-btn" onClick={onClick} disabled={disabled || loading}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'ob-spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {label}
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            <ArrowRight size={16} strokeWidth={2.5} />
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <style>{styles}
        @keyframes ob-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>

      <div className="ob-root">
        {/* Ambient background */}
        <div className="ob-orb ob-orb-1" />
        <div className="ob-orb ob-orb-2" />
        <div className="ob-orb ob-orb-3" />
        <div className="ob-grain" />

        <div className="ob-content">

          {/* ── Signup progress (shown on all signup steps) ── */}
          {isSignupStep && <ProgressBar />}

          {/* ══════════════ WELCOME ══════════════ */}
          {view === 'welcome' && (
            <div className="ob-view">
              <div className="ob-welcome-hero">

                {/* Animated logo mark */}
                <div className="ob-logo-wrap">
                  <div className="ob-logo-ring ob-logo-ring-2" />
                  <div className="ob-logo-ring" />
                  <div className="ob-logo-mark">
                    <span className="ob-logo-letters">S</span>
                  </div>
                </div>

                <h1 className="ob-wordmark">SanGPT</h1>
                <p className="ob-tagline">
                  A faster, smarter, more personal AI —<br />built for everything you create.
                </p>

                {/* Feature pills */}
                <div className="ob-pills">
                  {['✦ Smart', '✦ Fast', '✦ Personal', '✦ Creative'].map(p => (
                    <span key={p} className="ob-pill">{p}</span>
                  ))}
                </div>
              </div>

              <div className="ob-cta-area">
                {/* Google */}
                <button className="ob-social-btn" onClick={() => oauth('google')} disabled={loading}>
                  <GoogleIcon />
                  Continue with Google
                </button>

                {/* Apple */}
                <button className="ob-social-btn" onClick={() => oauth('apple')} disabled={loading}>
                  <AppleIcon />
                  Continue with Apple
                </button>

                {/* Divider */}
                <div className="ob-divider">
                  <div className="ob-divider-line" />
                  <span className="ob-divider-text">or</span>
                  <div className="ob-divider-line" />
                </div>

                {/* Email */}
                <button className="ob-primary-btn" onClick={() => setView('method')} disabled={loading}>
                  Use Email
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>

                <p className="ob-legal">
                  By continuing, you agree to our Terms of Service<br />and Privacy Policy.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════ METHOD ══════════════ */}
          {view === 'method' && (
            <div className="ob-view">
              <BackHeader onBack={() => setView('welcome')} />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">How would you<br />like to continue?</h2>
                  <p className="ob-step-sub">Sign in or create a new account</p>
                </div>
              </div>
              <div className="ob-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="ob-primary-btn" onClick={() => setView('signup-name')}>
                  Create Account
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
                <button className="ob-ghost-btn" onClick={() => setView('signin')}>
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ SIGN IN ══════════════ */}
          {view === 'signin' && (
            <div className="ob-view">
              <BackHeader onBack={() => setView('method')} title="Sign In" />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">Welcome back</h2>
                  <p className="ob-step-sub">Sign in to your SanGPT account</p>
                </div>
                <div className="ob-fields">
                  <div className="ob-field">
                    <label className="ob-label">Email</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="ob-field">
                    <label className="ob-label">Password</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input has-right"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" className="ob-input-action" onClick={() => setShowPwd(s => !s)}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="ob-link-btn" onClick={() => setView('forgot')}>
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <BottomCTA
                label={loading ? 'Signing in…' : 'Sign In'}
                onClick={handleSignIn as any}
                disabled={!email || !password}
              />
            </div>
          )}

          {/* ══════════════ FORGOT ══════════════ */}
          {view === 'forgot' && (
            <div className="ob-view">
              <BackHeader onBack={() => setView('signin')} title="Reset Password" />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">Forgot your<br />password?</h2>
                  <p className="ob-step-sub">Enter your email and we'll send you a reset link.</p>
                </div>
                <div className="ob-fields">
                  <div className="ob-field">
                    <label className="ob-label">Email</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>
              <BottomCTA
                label={loading ? 'Sending…' : 'Send Reset Link'}
                onClick={handleForgot as any}
                disabled={!/^\S+@\S+\.\S+$/.test(email)}
              />
            </div>
          )}

          {/* ══════════════ SIGNUP STEPS ══════════════ */}
          {isSignupStep && (
            <div className="ob-view">
              <BackHeader onBack={back} />
              <div className="ob-form-area">

                {/* ── Name ── */}
                {view === 'signup-name' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">What's your<br />name?</h2>
                      <p className="ob-step-sub">This is how you'll appear on SanGPT.</p>
                    </div>
                    <div className="ob-fields">
                      <div className="ob-field">
                        <label className="ob-label">First Name</label>
                        <input
                          className="ob-input"
                          autoFocus
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Jane"
                        />
                      </div>
                      <div className="ob-field">
                        <label className="ob-label">Last Name</label>
                        <input
                          className="ob-input"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Username ── */}
                {view === 'signup-username' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Pick a<br />username</h2>
                      <p className="ob-step-sub">Letters, numbers and underscores only.</p>
                    </div>
                    <div className="ob-fields">
                      <div className="ob-field">
                        <label className="ob-label">Username</label>
                        <div className="ob-input-wrap">
                          <input
                            className="ob-input"
                            autoFocus
                            value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase())}
                            placeholder="your_handle"
                          />
                        </div>
                        {username.length > 0 && (
                          <div className={`ob-username-hint ${stepValid ? 'valid' : 'invalid'}`}>
                            <div className={`ob-hint-dot ${stepValid ? 'valid' : 'invalid'}`} />
                            {stepValid
                              ? `@${username} is available`
                              : 'Use 3–20 chars: letters, numbers, underscores'}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── DOB ── */}
                {view === 'signup-dob' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">When's your<br />birthday?</h2>
                      <p className="ob-step-sub">We use this to personalize your experience.</p>
                    </div>
                    <div className="ob-fields">
                      <div className="ob-field">
                        <label className="ob-label">Date of Birth</label>
                        <input
                          className="ob-input"
                          type="date"
                          autoFocus
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Email ── */}
                {view === 'signup-email' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Your email<br />address</h2>
                      <p className="ob-step-sub">We'll send a verification link here.</p>
                    </div>
                    <div className="ob-fields">
                      <div className="ob-field">
                        <label className="ob-label">Email</label>
                        <input
                          className="ob-input"
                          type="email"
                          autoFocus
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Password ── */}
                {view === 'signup-password' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Create a<br />password</h2>
                      <p className="ob-step-sub">At least 6 characters. Make it strong.</p>
                    </div>
                    <div className="ob-fields">
                      <div className="ob-field">
                        <label className="ob-label">Password</label>
                        <div className="ob-input-wrap">
                          <input
                            className="ob-input has-right"
                            type={showPwd ? 'text' : 'password'}
                            autoFocus
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                          />
                          <button type="button" className="ob-input-action" onClick={() => setShowPwd(s => !s)}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {/* Strength bars */}
                        {password.length > 0 && (
                          <div className="ob-pwd-strength">
                            <div className={`ob-pwd-bar ${strength >= 1 ? strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong' : ''}`} />
                            <div className={`ob-pwd-bar ${strength >= 2 ? strength === 2 ? 'medium' : 'strong' : ''}`} />
                            <div className={`ob-pwd-bar ${strength >= 3 ? 'strong' : ''}`} />
                          </div>
                        )}
                      </div>
                      <div className="ob-field">
                        <label className="ob-label">Confirm Password</label>
                        <div className="ob-input-wrap">
                          <input
                            className="ob-input has-right"
                            type={showPwd ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                          />
                          {confirmPassword && password === confirmPassword && (
                            <span className="ob-input-action" style={{ color: '#4ade80', cursor: 'default' }}>
                              <Check size={16} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                        {confirmPassword && password === confirmPassword && (
                          <div className="ob-match-row">
                            <Check size={12} strokeWidth={2.5} />
                            Passwords match
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Bottom CTA */}
              <BottomCTA
                label={loading ? 'Creating account…' : view === 'signup-password' ? 'Create Account' : 'Continue'}
                onClick={next}
                disabled={!stepValid}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
};
