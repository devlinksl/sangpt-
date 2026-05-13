import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { SettingsItem } from '@/components/settings/SettingsItem';
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
  UserCircle // Using this as the Font Awesome style replacement
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

  const cycleDataMode = () => {
    const modes: ("standard" | "low" | "offline")[] = ['standard', 'low', 'offline'];
    const currentIndex = modes.indexOf(preferences.data_mode);
    const next = modes[(currentIndex + 1) % modes.length];
    updatePreference('data_mode', next);
  };

  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Sub-page routing
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
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-20">
        <div className="max-w-2xl mx-auto flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2 rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* User Card - Clean Font Awesome Style */}
        <section
          className="glass-card rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:bg-accent/5 transition-all border border-border/50 active:scale-[0.99]"
          onClick={() => setSubPage('profile')}
        >
          <div className="bg-accent/30 p-3 rounded-2xl">
            <UserCircle className="h-10 w-10 text-foreground/70" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email || 'Guest Account'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
        </section>

        {/* 1. Account & Security */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Account</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<User className="h-5 w-5" />} label="Profile Information" description="Name, photo, and email" onClick={() => setSubPage('profile')} index={0} />
            <SettingsItem icon={<Shield className="h-5 w-5" />} label="Account Security" description="Password and authentication" onClick={() => setSubPage('security')} index={1} />
            <SettingsItem icon={<Link2 className="h-5 w-5" />} label="Linked Accounts" description="Social login management" onClick={() => setSubPage('linked')} index={2} />
          </div>
        </div>

        {/* 2. Experience & Interface */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Experience</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<Sun className="h-5 w-5" />} label="Theme Mode" onClick={() => {
                   const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                   setTheme(next);
            }} trailing={themeLabel} index={3} />
            <SettingsItem icon={<MessageSquare className="h-5 w-5" />} label="Chat Appearance" description="Bubbles, font size, and density" onClick={() => setSubPage('chat-appearance')} index={4} />
            <SettingsItem icon={<Sparkles className="h-5 w-5" />} label="Animations" toggle toggled={preferences.animations} onToggle={(v) => updatePreference('animations', v)} index={5} />
          </div>
        </div>

        {/* 3. AI Behavior */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">AI Behavior</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<BrainCircuit className="h-5 w-5" />} label="Response Style" onClick={cycleResponseStyle} trailing={capitalize(preferences.response_style)} index={6} />
            <SettingsItem icon={<Gauge className="h-5 w-5" />} label="Typing Speed" onClick={cycleTypingSpeed} trailing={capitalize(preferences.typing_speed)} index={7} />
            <SettingsItem icon={<MessageCirclePlus className="h-5 w-5" />} label="Auto-Create Chat" toggle toggled={preferences.new_chat_auto} onToggle={(v) => updatePreference('new_chat_auto', v)} index={8} />
          </div>
        </div>

        {/* 4. Communication & Audio */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Notifications</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<Bell className="h-5 w-5" />} label="Push Notifications" toggle toggled={preferences.notifications} onToggle={(v) => updatePreference('notifications', v)} index={9} />
            <SettingsItem icon={<Volume2 className="h-5 w-5" />} label="Sounds & Haptics" toggle toggled={preferences.sound_haptics} onToggle={(v) => updatePreference('sound_haptics', v)} index={10} />
          </div>
        </div>

        {/* 5. Data & Storage */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Data Management</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<Database className="h-5 w-5" />} label="Custom Instructions" description="Data controls & AI memory" onClick={() => setSubPage('data-controls')} index={11} />
            <SettingsItem icon={<Wifi className="h-5 w-5" />} label="Data Usage" onClick={cycleDataMode} trailing={capitalize(preferences.data_mode)} index={12} />
            <SettingsItem icon={<History className="h-5 w-5" />} label="Chat History" description="Management and auto-archive" onClick={() => setSubPage('chat-history')} index={13} />
          </div>
        </div>

        {/* 6. Legal & Safety */}
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Support & Privacy</h3>
          <div className="glass-card rounded-[2rem] overflow-hidden border border-border/40 divide-y divide-border/10">
            <SettingsItem icon={<Eye className="h-5 w-5" />} label="Privacy Controls" onClick={() => setSubPage('privacy')} index={14} />
            <SettingsItem icon={<Info className="h-5 w-5" />} label="About SanGPT" onClick={() => setSubPage('about')} index={15} />
            <SettingsItem icon={<LogOut className="h-5 w-5 text-destructive" />} label="Sign Out" onClick={handleSignOut} destructive index={16} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground/50 tracking-widest font-medium uppercase">
            SanGPT v2.1.0 • Dev-Link
          </p>
        </div>
      </div>
    </div>
  );
}
