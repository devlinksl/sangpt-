import { SettingsSubPage } from './SettingsSubPage';

interface AboutSubPageProps {
  onBack: () => void;
}

export function AboutSubPage({ onBack }: AboutSubPageProps) {
  return (
    <SettingsSubPage title="About SanGPT" onBack={onBack}>
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-ai-blue to-ai-purple flex items-center justify-center shadow-lg">
          <span className="text-3xl font-bold text-white">S</span>
        </div>
        <h2 className="text-xl font-bold">SanGPT</h2>
        <p className="text-sm text-muted-foreground">Version 2.1.0</p>
      </div>

      <div className="glass-card rounded-2xl divide-y divide-border/30">
        <div className="p-4">
          <p className="text-sm font-medium">Developer</p>
          <p className="text-sm text-muted-foreground mt-0.5">Dev-Link</p>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium">Built with</p>
          <p className="text-sm text-muted-foreground mt-0.5">React • Lovable Cloud • Gemini AI</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl divide-y divide-border/30 mt-4">
        <a href="#" className="block p-4 active:bg-accent/60">
          <p className="text-sm font-medium">Terms of Service</p>
        </a>
        <a href="#" className="block p-4 active:bg-accent/60">
          <p className="text-sm font-medium">Privacy Policy</p>
        </a>
        <a href="#" className="block p-4 active:bg-accent/60">
          <p className="text-sm font-medium">Open Source Licenses</p>
        </a>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        © 2025 SanGPT. All rights reserved.
      </p>
    </SettingsSubPage>
  );
}
