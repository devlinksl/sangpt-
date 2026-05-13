import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { useAlert } from '@/hooks/useAlert';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ProfileInfoSubPage } from '@/components/settings/ProfileInfoSubPage';
import { AboutSubPage } from '@/components/settings/AboutSubPage';
import { AccountSecuritySubPage } from '@/components/settings/AccountSecuritySubPage';
import { LinkedAccountsSubPage } from '@/components/settings/LinkedAccountsSubPage';
import { ChatAppearanceSubPage } from '@/components/settings/ChatAppearanceSubPage';
import { NotificationsSubPage } from '@/components/settings/NotificationsSubPage';
import { SoundsHapticsSubPage } from '@/components/settings/SoundsHapticsSubPage';
import { ChatHistorySubPage } from '@/components/settings/ChatHistorySubPage';
import { PrivacyControlsSubPage } from '@/components/settings/PrivacyControlsSubPage';
import { DataControlsSubPage } from '@/components/settings/DataControlsSubPage';
import {
  ChevronLeft,
  User,
  Shield,
  Link2,
  Sun,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  Gauge,
  MessageCirclePlus,
  Bell,
  Volume2,
  Wifi,
  History,
  Eye,
  Info,
  LogOut,
  Database,
  ChevronRight,
} from 'lucide-react';

type SubPage =
  | 'main'
  | 'profile'
  | 'about'
  | 'security'
  | 'linked'
  | 'chat-appearance'
  | 'notifications'
  | 'sounds'
  | 'chat-history'
  | 'privacy'
  | 'data-controls';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference } = useUserPreferences();
  const [subPage, setSubPage] = useState<SubPage>('main');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const cycleResponseStyle = () => {
    const styles: ("concise" | "balanced" | "detailed")[] = ['concise', 'balanced', 'detailed'];
    const currentIndex = styles.indexOf(preferences.response_style);
    const next = styles[(currentIndex + 1) % styles.length];
    updatePreference('response_style', next);
  };

  const cycleTypingSpeed = () => {
    const speeds: ("slow" | "normal" | "fast")[] = ['slow', 'normal', 'fast'];
    const currentIndex = speeds.indexOf(preferences.typing_speed);
    const next = speeds[(currentIndex + 1) % speeds.length];
    updatePreference('typing_speed', next);
  };

  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Sub-page logic (kept identical to your original logic)
  if (subPage === 'profile') return <ProfileInfoSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'about') return <AboutSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'security') return <AccountSecuritySubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'linked') return <LinkedAccountsSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'chat-appearance') return <ChatAppearanceSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'notifications') return <NotificationsSubPage onBack={() => setSubPage('main')} notifications={preferences.notifications} onToggleNotifications={(v) => updatePreference('notifications', v)} />;
  if (subPage === 'sounds') return <SoundsHapticsSubPage onBack={() => setSubPage('main')} soundHaptics={preferences.sound_haptics} onToggleSoundHaptics={(v) => updatePreference('sound_haptics', v)} />;
  if (subPage === 'chat-history') return <ChatHistorySubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'privacy') return <PrivacyControlsSubPage onBack={() => setSubPage('main')} analyticsOptOut={preferences.analytics_opt_out} onToggleAnalytics={(v) => updatePreference('analytics_opt_out', v)} />;
  if (subPage === 'data-controls') return <DataControlsSubPage onBack={() => setSubPage('main')} />;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Dynamic Modern Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-accent rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-8 mt-4">
        
        {/* Profile Section - Enhanced elevation */}
        <section>
          <div
            className="group glass-card rounded-3xl p-6 flex items-center gap-5 cursor-pointer 
                       hover:bg-accent/5 transition-all duration-300 border border-border/50 shadow-sm active:scale-[0.99]"
            onClick={() => setSubPage('profile')}
          >
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-background shadow-2xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-ai-purple text-white text-2xl font-bold">
                  {user?.user_metadata?.display_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight">
                {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground opacity-80">
                {user?.email || 'Sign in to sync data'}
              </p>
            </div>
            <div className="bg-accent/20 p-2 rounded-full group-hover:bg-accent transition-colors">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Settings Grid Pattern */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Group 1: Account */}
          <div className="space-y-3">
            <h3 className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Account System</h3>
            <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/20">
              <SettingsItem icon={<User className="text-blue-500" />} label="Personal Info" description="Identity and contact" onClick={() => setSubPage('profile')} index={0} />
              <SettingsItem icon={<Shield className="text-emerald-500" />} label="Security" description="Password and 2FA" onClick={() => setSubPage('security')} index={1} />
              <SettingsItem icon={<Link2 className="text-orange-500" />} label="Connected Apps" description="Manage Google/Email" onClick={() => setSubPage('linked')} index={2} />
            </div>
          </div>

          {/* Group 2: Interaction */}
          <div className="space-y-3">
            <h3 className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Intelligence & UI</h3>
            <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/20">
              <SettingsItem icon={<Sun className="text-yellow-500" />} label="Appearance" trailing={<span className="text-primary font-medium">{themeLabel}</span>} onClick={() => {
                   const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                   setTheme(next);
              }} index={3} />
              <SettingsItem icon={<BrainCircuit className="text-purple-500" />} label="Response Style" trailing={<span className="text-primary font-medium">{capitalize(preferences.response_style)}</span>} onClick={cycleResponseStyle} index={4} />
              <SettingsItem icon={<Gauge className="text-rose-500" />} label="Typing Speed" trailing={capitalize(preferences.typing_speed)} onClick={cycleTypingSpeed} index={5} />
              <SettingsItem icon={<Sparkles className="text-cyan-500" />} label="Eye Candy" description="UI Animations" toggle toggled={preferences.animations} onToggle={(v) => updatePreference('animations', v)} index={6} />
            </div>
          </div>

          {/* Group 3: Privacy & Data */}
          <div className="space-y-3">
            <h3 className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Privacy & Storage</h3>
            <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/20">
              <SettingsItem icon={<Database className="text-indigo-500" />} label="Knowledge Base" description="Custom AI instructions" onClick={() => setSubPage('data-controls')} index={7} />
              <SettingsItem icon={<History className="text-amber-500" />} label="History" description="Auto-delete settings" onClick={() => setSubPage('chat-history')} index={8} />
              <SettingsItem icon={<Eye className="text-slate-500" />} label="Privacy Mode" description="Analytics & tracking" onClick={() => setSubPage('privacy')} index={9} />
            </div>
          </div>

          {/* Group 4: App Info & Logout */}
          <div className="space-y-3">
             <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/20">
              <SettingsItem icon={<Info className="text-blue-400" />} label="About SanGPT" description="Version 2.1.0" onClick={() => setSubPage('about')} index={10} />
              <SettingsItem icon={<LogOut className="text-destructive" />} label="Sign Out" destructive onClick={handleSignOut} index={11} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 opacity-50 pt-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            SanGPT AI Framework
          </p>
          <p className="text-xs">Crafted by Dev-Link</p>
        </div>
      </div>
    </div>
  );
}
