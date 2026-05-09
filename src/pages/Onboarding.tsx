import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAlert } from '@/hooks/useAlert';
import { humanizeError } from '@/lib/humanizeError';

// ─── Types ────────────────────────────────────────────────────────────────────
type View =
  | 'splash'
  | 'welcome'
  | 'method'
  | 'signin-email'
  | 'signin-password'
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
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

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

  /* ── Orbs — only on welcome screen ── */
  .ob-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(90px);
    transition: opacity 1s ease;
  }
  .ob-orb-1 {
    width: 380px; height: 380px;
    background: hsl(var(--primary));
    opacity: 0.14;
    top: -100px; left: -60px;
    animation: ob-drift-1 13s ease-in-out infinite alternate;
  }
  .ob-orb-2 {
    width: 260px; height: 260px;
    background: hsl(var(--primary) / 0.55);
    opacity: 0.12;
    bottom: 80px; right: -50px;
    animation: ob-drift-2 16s ease-in-out infinite alternate;
  }

  @keyframes ob-drift-1 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(35px,55px) scale(1.12); }
  }
  @keyframes ob-drift-2 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(-25px,-35px) scale(1.08); }
  }

  .ob-grain {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.022;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 160px;
  }

  .ob-content {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── View entrance ── */
  .ob-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    animation: ob-enter 0.36s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes ob-enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ══════════════════════════════════════════
     SPLASH SCREEN
  ══════════════════════════════════════════ */
  .ob-splash {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: hsl(var(--background));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    pointer-events: none;
  }

  /* Phase 1: logo mark scales in */
  .ob-splash-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: ob-splash-logo-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  @keyframes ob-splash-logo-in {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }

  .ob-splash-mark {
    width: 72px; height: 72px;
    border-radius: 22px;
    background: hsl(var(--primary) / 0.1);
    border: 1px solid hsl(var(--primary) / 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .ob-splash-mark::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 23px;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent 60%);
    pointer-events: none;
  }
  .ob-splash-s {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 36px;
    letter-spacing: -0.04em;
    color: hsl(var(--foreground));
    line-height: 1;
  }

  .ob-splash-wordmark {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 32px;
    letter-spacing: -0.04em;
    color: hsl(var(--foreground));
    line-height: 1;
  }

  /* Phase 2: tagline fades up below */
  .ob-splash-tagline {
    margin-top: 28px;
    text-align: center;
    opacity: 0;
  }
  .ob-splash-tagline.ob-tagline-show {
    animation: ob-tagline-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.45s forwards;
  }
  @keyframes ob-tagline-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ob-splash-made {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: hsl(var(--muted-foreground) / 0.5);
    line-height: 1;
    margin-bottom: 5px;
  }
  .ob-splash-studio {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: hsl(var(--foreground) / 0.75);
    line-height: 1;
  }
  .ob-splash-country {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 300;
    font-style: italic;
    color: hsl(var(--muted-foreground) / 0.45);
    margin-top: 4px;
    letter-spacing: 0.05em;
  }

  /* Phase 3: entire splash fades out */
  .ob-splash.ob-splash-out {
    animation: ob-splash-fade-out 0.45s ease forwards;
  }
  @keyframes ob-splash-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* ══════════════════════════════════════════
     WELCOME
  ══════════════════════════════════════════ */
  .ob-welcome-hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 28px 28px;
    text-align: center;
  }

  /* Orbital logo */
  .ob-logo-wrap {
    position: relative;
    width: 88px; height: 88px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 32px;
  }
  .ob-logo-ring {
    position: absolute;
    inset: -18px;
    border-radius: 50%;
    border: 1px solid hsl(var(--primary) / 0.18);
    animation: ob-ring 10s linear infinite;
  }
  .ob-logo-ring-2 {
    inset: -34px;
    border-color: hsl(var(--primary) / 0.07);
    animation: ob-ring 18s linear infinite reverse;
  }
  @keyframes ob-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .ob-logo-ring::before {
    content: '';
    position: absolute;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: hsl(var(--primary));
    box-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5);
    top: 50%; left: -3.5px;
    transform: translateY(-50%);
  }
  .ob-logo-mark {
    width: 88px; height: 88px;
    border-radius: 28px;
    background: hsl(var(--primary) / 0.09);
    border: 1px solid hsl(var(--primary) / 0.22);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(12px);
    position: relative;
    z-index: 1;
  }
  .ob-logo-s {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 38px;
    letter-spacing: -0.04em;
    color: hsl(var(--foreground));
    line-height: 1;
  }

  .ob-wordmark {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 36px;
    letter-spacing: -0.04em;
    color: hsl(var(--foreground));
    line-height: 1;
    margin-bottom: 12px;
  }
  .ob-tagline {
    font-size: 15px;
    font-weight: 300;
    color: hsl(var(--muted-foreground));
    line-height: 1.65;
    max-width: 255px;
  }

  .ob-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    justify-content: center;
    margin-top: 22px;
  }
  .ob-pill {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 11px;
    border-radius: 999px;
    background: hsl(var(--primary) / 0.07);
    border: 1px solid hsl(var(--primary) / 0.16);
    color: hsl(var(--foreground) / 0.65);
  }

  /* ── CTA area ── */
  .ob-cta-area {
    padding: 0 22px 36px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    align-self: stretch;
  }

  /* Social buttons */
  .ob-social-btn {
    width: 100%;
    height: 52px;
    border-radius: 14px;
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
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .ob-social-btn:hover { background: hsl(var(--accent) / 0.5); }
  .ob-social-btn:active { transform: scale(0.98); }
  .ob-social-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .ob-social-icon { width: 20px; height: 20px; flex-shrink: 0; }

  .ob-divider {
    display: flex; align-items: center; gap: 12px; padding: 2px 0;
  }
  .ob-divider-line { flex: 1; height: 1px; background: hsl(var(--border)); }
  .ob-divider-text { font-size: 12px; color: hsl(var(--muted-foreground)); }

  /* Primary button */
  .ob-primary-btn {
    width: 100%;
    height: 52px;
    border-radius: 14px;
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
  .ob-primary-btn:hover:not(:disabled) { opacity: 0.86; }
  .ob-primary-btn:active:not(:disabled) { transform: scale(0.98); }
  .ob-primary-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  /* Ghost button */
  .ob-ghost-btn {
    width: 100%;
    height: 48px;
    border-radius: 13px;
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
  .ob-ghost-btn:hover:not(:disabled) { background: hsl(var(--accent) / 0.45); }
  .ob-ghost-btn:active:not(:disabled) { transform: scale(0.98); }

  .ob-legal {
    font-size: 11px;
    color: hsl(var(--muted-foreground) / 0.55);
    text-align: center;
    line-height: 1.5;
  }

  /* ── HEADER ── */
  .ob-header {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 14px;
    position: relative;
    flex-shrink: 0;
  }
  .ob-back-btn {
    width: 40px; height: 40px;
    border-radius: 12px;
    border: 1px solid hsl(var(--border) / 0.5);
    background: hsl(var(--accent) / 0.25);
    color: hsl(var(--foreground));
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.12s ease;
    flex-shrink: 0;
  }
  .ob-back-btn:hover { background: hsl(var(--accent) / 0.5); }
  .ob-back-btn:active { transform: scale(0.9); }

  .ob-header-title {
    position: absolute;
    left: 50%; transform: translateX(-50%);
    font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 600;
    letter-spacing: -0.02em;
    color: hsl(var(--foreground));
    white-space: nowrap;
  }

  /* ── PROGRESS ── */
  .ob-progress-wrap { padding: 14px 22px 0; }
  .ob-progress-track {
    height: 3px;
    background: hsl(var(--muted) / 0.45);
    border-radius: 999px; overflow: hidden;
  }
  .ob-progress-fill {
    height: 100%;
    background: hsl(var(--foreground));
    border-radius: 999px;
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  .ob-progress-meta {
    display: flex; justify-content: space-between; align-items: center; margin-top: 8px;
  }
  .ob-progress-label {
    font-size: 11px; font-weight: 500;
    color: hsl(var(--muted-foreground));
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .ob-step-dots { display: flex; gap: 4px; }
  .ob-step-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: hsl(var(--muted) / 0.45);
    transition: background 0.3s ease, transform 0.3s ease;
  }
  .ob-step-dot.done { background: hsl(var(--foreground)); }
  .ob-step-dot.active { background: hsl(var(--foreground)); transform: scale(1.4); }

  /* ── FORM ── */
  .ob-form-area {
    flex: 1;
    display: flex; flex-direction: column;
    padding: 0 22px;
    max-width: 420px; width: 100%;
    margin: 0 auto; align-self: stretch;
  }

  .ob-step-header { padding: 24px 0 20px; }
  .ob-step-title {
    font-family: 'Sora', sans-serif;
    font-size: 26px; font-weight: 700;
    letter-spacing: -0.03em;
    color: hsl(var(--foreground));
    line-height: 1.18; margin-bottom: 7px;
  }
  .ob-step-sub {
    font-size: 14px;
    color: hsl(var(--muted-foreground));
    line-height: 1.5;
  }

  .ob-fields { display: flex; flex-direction: column; gap: 15px; }

  .ob-label {
    display: block;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: hsl(var(--muted-foreground));
    margin-bottom: 6px;
  }

  .ob-input-wrap { position: relative; }
  .ob-input {
    width: 100%; height: 52px;
    border-radius: 14px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--accent) / 0.18);
    color: hsl(var(--foreground));
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 0 16px;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    -webkit-appearance: none; appearance: none;
    box-sizing: border-box;
  }
  .ob-input:focus {
    border-color: hsl(var(--foreground) / 0.35);
    background: hsl(var(--accent) / 0.3);
    box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.05);
  }
  .ob-input::placeholder { color: hsl(var(--muted-foreground) / 0.45); }
  .ob-input.has-right { padding-right: 50px; }

  .ob-input-action {
    position: absolute;
    right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: hsl(var(--muted-foreground));
    cursor: pointer; padding: 4px;
    display: flex; align-items: center;
    transition: color 0.15s ease;
  }
  .ob-input-action:hover { color: hsl(var(--foreground)); }

  /* Email display chip (on password step of signin) */
  .ob-email-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: hsl(var(--accent) / 0.4);
    border: 1px solid hsl(var(--border) / 0.5);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--foreground) / 0.75);
    margin-bottom: 20px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .ob-email-chip:hover { background: hsl(var(--accent) / 0.6); }
  .ob-email-chip-edit {
    font-size: 11px;
    color: hsl(var(--primary));
    font-weight: 500;
  }

  /* Password strength */
  .ob-pwd-strength { margin-top: 8px; display: flex; gap: 4px; }
  .ob-pwd-bar {
    flex: 1; height: 2px; border-radius: 999px;
    background: hsl(var(--muted) / 0.35);
    transition: background 0.3s ease;
  }
  .ob-pwd-bar.weak   { background: #f87171; }
  .ob-pwd-bar.medium { background: #fb923c; }
  .ob-pwd-bar.strong { background: #4ade80; }

  .ob-match-row {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; margin-top: 7px;
    color: #4ade80; font-weight: 500;
  }

  .ob-link-btn {
    background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    cursor: pointer; padding: 0;
    transition: color 0.15s ease; text-align: left;
  }
  .ob-link-btn:hover { color: hsl(var(--foreground)); }

  /* Username hint */
  .ob-username-hint {
    font-size: 11px; margin-top: 6px;
    display: flex; align-items: center; gap: 5px;
    transition: color 0.2s ease;
  }
  .ob-username-hint.valid   { color: #4ade80; }
  .ob-username-hint.invalid { color: hsl(var(--muted-foreground) / 0.5); }
  .ob-hint-dot {
    width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  }
  .ob-hint-dot.valid   { background: #4ade80; }
  .ob-hint-dot.invalid { background: hsl(var(--muted-foreground) / 0.35); }

  /* Bottom CTA */
  .ob-bottom {
    padding: 18px 22px 32px;
    max-width: 420px; width: 100%;
    margin: 0 auto; align-self: stretch;
  }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="ob-social-icon" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.000,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);
const AppleIcon = () => (
  <svg className="ob-social-icon" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// ─── Utils ────────────────────────────────────────────────────────────────────
function pwdStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd) && pwd.length >= 10) s++;
  return s as 0 | 1 | 2 | 3;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ animation: 'ob-spin 0.75s linear infinite', flexShrink: 0 }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Splash Screen ────────────────────────────────────────────────────────────
const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [phase, setPhase] = useState<'in' | 'tagline' | 'out'>('in');

  useEffect(() => {
    // Random hold duration: 1.6s–2.5s total visible time
    const holdMs = 1600 + Math.random() * 900;

    // Show tagline after logo settles
    const t1 = setTimeout(() => setPhase('tagline'), 400);
    // Begin fade-out
    const t2 = setTimeout(() => setPhase('out'), holdMs);
    // Unmount
    const t3 = setTimeout(onDone, holdMs + 480);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes ob-spin {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        .ob-splash-logo-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          animation: ob-splash-logo-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes ob-splash-logo-in {
          from { opacity: 0; transform: scale(0.72) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ob-splash-tagline-wrap {
          margin-top: 30px; text-align: center;
          opacity: 0;
        }
        .ob-splash-tagline-wrap.show {
          animation: ob-tagline-reveal 0.65s cubic-bezier(0.22,1,0.36,1) 0s both;
        }
        @keyframes ob-tagline-reveal {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ob-splash-screen {
          position: fixed; inset: 0; z-index: 200;
          background: hsl(var(--background));
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          pointer-events: none;
        }
        .ob-splash-screen.out {
          animation: ob-splash-out 0.45s ease 0s both;
        }
        @keyframes ob-splash-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      <div className={`ob-splash-screen${phase === 'out' ? ' out' : ''}`}>

        {/* Logo + Wordmark */}
        <div className="ob-splash-logo-wrap">
          <div className="ob-splash-mark">
            <span className="ob-splash-s">S</span>
          </div>
          <span className="ob-splash-wordmark">SanGPT</span>
        </div>

        {/* Tagline — slides up after logo settles */}
        <div className={`ob-splash-tagline-wrap${phase !== 'in' ? ' show' : ''}`}>
          <p className="ob-splash-made">Made by</p>
          <p className="ob-splash-studio">Dev-Link Sierra Leone</p>
        </div>

      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Onboarding = () => {
  const { alert } = useAlert();
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView]   = useState<View>('welcome');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [username, setUsername]             = useState('');
  const [dob, setDob]                       = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const stepIndex    = SIGNUP_STEPS.indexOf(view);
  const isSignupStep = stepIndex >= 0;
  const totalSteps   = SIGNUP_STEPS.length;
  const progress     = isSignupStep ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  const strength     = pwdStrength(password);

  // ── Auth (all original logic) ────────────────────────────────────────────
  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
    } catch (e: any) {
      alert({ title: 'Sign in failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      alert({ title: 'Sign in failed', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert({ title: 'Check your email', description: 'We sent you a reset link.', variant: 'success' });
      setView('signin-email');
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
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName, last_name: lastName, username,
            date_of_birth: dob, display_name: `${firstName} ${lastName}`.trim(),
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
      case 'signin-email':    return /^\S+@\S+\.\S+$/.test(email);
      case 'signin-password': return password.length >= 1;
      case 'forgot':          return /^\S+@\S+\.\S+$/.test(email);
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
        <span className="ob-progress-label">Step {stepIndex + 1} / {totalSteps}</span>
        <div className="ob-step-dots">
          {SIGNUP_STEPS.map((_, i) => (
            <div key={i} className={`ob-step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );

  const BottomCTA = ({
    label, onClick, disabled, secondaryLabel, onSecondary
  }: {
    label: string; onClick?: () => void; disabled?: boolean;
    secondaryLabel?: string; onSecondary?: () => void;
  }) => (
    <div className="ob-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <button className="ob-primary-btn" onClick={onClick} disabled={disabled || loading}>
        {loading ? <><Spinner />{label}</> : <>{label}<ArrowRight size={15} strokeWidth={2.5} /></>}
      </button>
      {secondaryLabel && onSecondary && (
        <button className="ob-ghost-btn" onClick={onSecondary} disabled={loading}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );

  return (
    <>
      <style>{`${styles}
        @keyframes ob-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Cinematic Splash ── */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="ob-root">
        {/* Ambient orbs — only on welcome */}
        {view === 'welcome' && (
          <>
            <div className="ob-orb ob-orb-1" />
            <div className="ob-orb ob-orb-2" />
            <div className="ob-grain" />
          </>
        )}

        <div className="ob-content">
          {isSignupStep && <ProgressBar />}

          {/* ══════════════ WELCOME ══════════════ */}
          {view === 'welcome' && (
            <div className="ob-view">
              <div className="ob-welcome-hero">
                <div className="ob-logo-wrap">
                  <div className="ob-logo-ring ob-logo-ring-2" />
                  <div className="ob-logo-ring" />
                  <div className="ob-logo-mark">
                    <span className="ob-logo-s">S</span>
                  </div>
                </div>
                <h1 className="ob-wordmark">SanGPT</h1>
                <p className="ob-tagline">
                  A faster, smarter, more personal AI —<br />built for everything you create.
                </p>
                <div className="ob-pills">
                  {['✦ Smart', '✦ Fast', '✦ Personal', '✦ Creative'].map(p => (
                    <span key={p} className="ob-pill">{p}</span>
                  ))}
                </div>
              </div>

              <div className="ob-cta-area">
                <button className="ob-social-btn" onClick={() => oauth('google')} disabled={loading}>
                  <GoogleIcon /> Continue with Google
                </button>
                <button className="ob-social-btn" onClick={() => oauth('apple')} disabled={loading}>
                  <AppleIcon /> Continue with Apple
                </button>
                <div className="ob-divider">
                  <div className="ob-divider-line" />
                  <span className="ob-divider-text">or</span>
                  <div className="ob-divider-line" />
                </div>
                <button className="ob-primary-btn" onClick={() => setView('method')} disabled={loading}>
                  Use Email <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                <p className="ob-legal">By continuing you agree to our Terms & Privacy Policy.</p>
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
                  <p className="ob-step-sub">Sign in to your account or create a new one.</p>
                </div>
              </div>
              <BottomCTA
                label="Create Account"
                onClick={() => setView('signup-name')}
                secondaryLabel="Sign In"
                onSecondary={() => { setPassword(''); setView('signin-email'); }}
              />
            </div>
          )}

          {/* ══════════════ SIGN IN — EMAIL ══════════════ */}
          {view === 'signin-email' && (
            <div className="ob-view">
              <BackHeader onBack={() => setView('method')} title="Sign In" />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">Enter your<br />email</h2>
                  <p className="ob-step-sub">We'll look up your SanGPT account.</p>
                </div>
                <div className="ob-fields">
                  <div>
                    <label className="ob-label">Email address</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input"
                        type="email"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && stepValid) setView('signin-password'); }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <BottomCTA
                label="Continue"
                onClick={() => setView('signin-password')}
                disabled={!stepValid}
              />
            </div>
          )}

          {/* ══════════════ SIGN IN — PASSWORD ══════════════ */}
          {view === 'signin-password' && (
            <div className="ob-view">
              <BackHeader onBack={() => { setPassword(''); setView('signin-email'); }} title="Sign In" />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">Enter your<br />password</h2>
                </div>

                {/* Email chip — tap to go back and change */}
                <button
                  className="ob-email-chip"
                  onClick={() => { setPassword(''); setView('signin-email'); }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {email}
                  <span className="ob-email-chip-edit">Edit</span>
                </button>

                <div className="ob-fields">
                  <div>
                    <label className="ob-label">Password</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input has-right"
                        type={showPwd ? 'text' : 'password'}
                        autoFocus
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && stepValid) handleSignIn(); }}
                      />
                      <button type="button" className="ob-input-action" onClick={() => setShowPwd(s => !s)}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="ob-link-btn" onClick={() => setView('forgot')}>
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <BottomCTA
                label={loading ? 'Signing in…' : 'Sign In'}
                onClick={handleSignIn}
                disabled={!stepValid}
              />
            </div>
          )}

          {/* ══════════════ FORGOT ══════════════ */}
          {view === 'forgot' && (
            <div className="ob-view">
              <BackHeader onBack={() => setView('signin-password')} title="Reset Password" />
              <div className="ob-form-area">
                <div className="ob-step-header">
                  <h2 className="ob-step-title">Forgot your<br />password?</h2>
                  <p className="ob-step-sub">Enter your email and we'll send a reset link.</p>
                </div>
                <div className="ob-fields">
                  <div>
                    <label className="ob-label">Email</label>
                    <div className="ob-input-wrap">
                      <input
                        className="ob-input"
                        type="email"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <BottomCTA
                label={loading ? 'Sending…' : 'Send Reset Link'}
                onClick={handleForgot}
                disabled={!stepValid}
              />
            </div>
          )}

          {/* ══════════════ SIGNUP STEPS ══════════════ */}
          {isSignupStep && (
            <div className="ob-view">
              <BackHeader onBack={back} />
              <div className="ob-form-area">

                {/* Name */}
                {view === 'signup-name' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">What's your<br />name?</h2>
                      <p className="ob-step-sub">This is how you'll appear on SanGPT.</p>
                    </div>
                    <div className="ob-fields">
                      <div>
                        <label className="ob-label">First Name</label>
                        <input className="ob-input" autoFocus placeholder="Jane"
                          value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </div>
                      <div>
                        <label className="ob-label">Last Name</label>
                        <input className="ob-input" placeholder="Doe"
                          value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Username */}
                {view === 'signup-username' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Pick a<br />username</h2>
                      <p className="ob-step-sub">Letters, numbers and underscores only.</p>
                    </div>
                    <div className="ob-fields">
                      <div>
                        <label className="ob-label">Username</label>
                        <input className="ob-input" autoFocus placeholder="your_handle"
                          value={username}
                          onChange={e => setUsername(e.target.value.toLowerCase())} />
                        {username.length > 0 && (
                          <div className={`ob-username-hint ${stepValid ? 'valid' : 'invalid'}`}>
                            <div className={`ob-hint-dot ${stepValid ? 'valid' : 'invalid'}`} />
                            {stepValid ? `@${username} looks good` : '3–20 chars: letters, numbers, underscores'}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* DOB */}
                {view === 'signup-dob' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">When's your<br />birthday?</h2>
                      <p className="ob-step-sub">Used to personalize your experience.</p>
                    </div>
                    <div className="ob-fields">
                      <div>
                        <label className="ob-label">Date of Birth</label>
                        <input className="ob-input" type="date" autoFocus
                          value={dob} onChange={e => setDob(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                {view === 'signup-email' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Your email<br />address</h2>
                      <p className="ob-step-sub">We'll send a verification link here.</p>
                    </div>
                    <div className="ob-fields">
                      <div>
                        <label className="ob-label">Email</label>
                        <input className="ob-input" type="email" autoFocus placeholder="you@example.com"
                          value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Password */}
                {view === 'signup-password' && (
                  <>
                    <div className="ob-step-header">
                      <h2 className="ob-step-title">Create a<br />password</h2>
                      <p className="ob-step-sub">At least 6 characters. Make it strong.</p>
                    </div>
                    <div className="ob-fields">
                      <div>
                        <label className="ob-label">Password</label>
                        <div className="ob-input-wrap">
                          <input
                            className="ob-input has-right" autoFocus
                            type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
                            value={password} onChange={e => setPassword(e.target.value)}
                          />
                          <button type="button" className="ob-input-action" onClick={() => setShowPwd(s => !s)}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {password.length > 0 && (
                          <div className="ob-pwd-strength">
                            <div className={`ob-pwd-bar ${strength >= 1 ? strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong' : ''}`} />
                            <div className={`ob-pwd-bar ${strength >= 2 ? strength === 2 ? 'medium' : 'strong' : ''}`} />
                            <div className={`ob-pwd-bar ${strength >= 3 ? 'strong' : ''}`} />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="ob-label">Confirm Password</label>
                        <div className="ob-input-wrap">
                          <input
                            className="ob-input has-right"
                            type={showPwd ? 'text' : 'password'} placeholder="Repeat password"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          />
                          {confirmPassword && password === confirmPassword && (
                            <span className="ob-input-action" style={{ color: '#4ade80', cursor: 'default' }}>
                              <Check size={16} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                        {confirmPassword && password === confirmPassword && (
                          <div className="ob-match-row">
                            <Check size={12} strokeWidth={2.5} /> Passwords match
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </div>

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
