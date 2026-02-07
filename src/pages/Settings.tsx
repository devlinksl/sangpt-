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
  | 'privacy';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { alert } = useAlert();
  const { preferences, updatePreference } = useUserPreferences();

  const [subPage, setSubPage] = useState<SubPage>('main');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const cycleResponseStyle = () => {
    const next =
      preferences.response_style === 'concise'
        ? 'balanced'
        : preferences.response_style === 'balanced'
        ? 'detailed'
        : 'concise';
    updatePreference('response_style', next);
  };

  const cycleTypingSpeed = () => {
    const next =
      preferences.typing_speed === 'slow'
        ? 'normal'
        : preferences.typing_speed === 'normal'
        ? 'fast'
        : 'slow';
    updatePreference('typing_speed', next);
  };

  const cycleDataMode = () => {
    const next =
      preferences.data_mode === 'standard'
        ? 'low'
        : preferences.data_mode === 'low'
        ? 'offline'
        : 'standard';
    updatePreference('data_mode', next);
  };

  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';
  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    updatePreference('theme', next);
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Sub-page routing
  if (subPage === 'profile') return <ProfileInfoSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'about') return <AboutSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'security') return <AccountSecuritySubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'linked') return <LinkedAccountsSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'chat-appearance') return <ChatAppearanceSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'notifications')
    return (
      <NotificationsSubPage
        onBack={() => setSubPage('main')}
        notifications={preferences.notifications}
        onToggleNotifications={(v) => updatePreference('notifications', v)}
      />
    );
  if (subPage === 'sounds')
    return (
      <SoundsHapticsSubPage
        onBack={() => setSubPage('main')}
        soundHaptics={preferences.sound_haptics}
        onToggleSoundHaptics={(v) => updatePreference('sound_haptics', v)}
      />
    );
  if (subPage === 'chat-history') return <ChatHistorySubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'privacy')
    return (
      <PrivacyControlsSubPage
        onBack={() => setSubPage('main')}
        analyticsOptOut={preferences.analytics_opt_out}
        onToggleAnalytics={(v) => updatePreference('analytics_opt_out', v)}
      />
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-border/30 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-12">
        {/* Profile Card */}
        <div
          className="glass-card rounded-2xl p-5 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-200"
          onClick={() => setSubPage('profile')}
        >
          <Avatar className="h-16 w-16 bg-gradient-to-br from-ai-blue to-ai-purple shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white text-xl font-semibold">
              {user?.user_metadata?.display_name?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase() ||
                'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email || 'Sign in to access settings'}
            </p>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 shrink-0" />
        </div>

        {/* 1. Account & Profile */}
        <SettingsSection title="Account & Profile">
          <SettingsItem
            icon={<User className="h-[18px] w-[18px]" />}
            label="Profile Information"
            description="Name, photo, and email"
            onClick={() => setSubPage('profile')}
            index={0}
          />
          <SettingsItem
            icon={<Shield className="h-[18px] w-[18px]" />}
            label="Account Security"
            description="Password and authentication"
            onClick={() => setSubPage('security')}
            index={1}
          />
          <SettingsItem
            icon={<Link2 className="h-[18px] w-[18px]" />}
            label="Linked Accounts"
            description="Google and email sign-in"
            onClick={() => setSubPage('linked')}
            index={2}
          />
        </SettingsSection>

        {/* 2. Appearance & Experience */}
        <SettingsSection title="Appearance & Experience">
          <SettingsItem
            icon={<Sun className="h-[18px] w-[18px]" />}
            label="Theme Mode"
            onClick={cycleTheme}
            trailing={themeLabel}
            index={3}
          />
          <SettingsItem
            icon={<MessageSquare className="h-[18px] w-[18px]" />}
            label="Chat Appearance"
            description="Font size, bubble style, density"
            onClick={() => setSubPage('chat-appearance')}
            index={4}
          />
          <SettingsItem
            icon={<Sparkles className="h-[18px] w-[18px]" />}
            label="Animations & Smoothness"
            description="Enhanced visual effects"
            toggle
            toggled={preferences.animations}
            onToggle={(v) => updatePreference('animations', v)}
            index={5}
          />
        </SettingsSection>

        {/* 3. AI & Chat Behavior */}
        <SettingsSection title="AI & Chat Behavior">
          <SettingsItem
            icon={<BrainCircuit className="h-[18px] w-[18px]" />}
            label="AI Response Style"
            onClick={cycleResponseStyle}
            trailing={capitalize(preferences.response_style)}
            index={6}
          />
          <SettingsItem
            icon={<Gauge className="h-[18px] w-[18px]" />}
            label="Typing Speed"
            description="Typewriter effect speed"
            onClick={cycleTypingSpeed}
            trailing={capitalize(preferences.typing_speed)}
            index={7}
          />
          <SettingsItem
            icon={<MessageCirclePlus className="h-[18px] w-[18px]" />}
            label="New Chat Behavior"
            description="Auto-create on first message"
            toggle
            toggled={preferences.new_chat_auto}
            onToggle={(v) => updatePreference('new_chat_auto', v)}
            index={8}
          />
        </SettingsSection>

        {/* 4. Notifications & Sound */}
        <SettingsSection title="Notifications & Sound">
          <SettingsItem
            icon={<Bell className="h-[18px] w-[18px]" />}
            label="Notifications"
            description="Messages, updates, and alerts"
            onClick={() => setSubPage('notifications')}
            toggle
            toggled={preferences.notifications}
            onToggle={(v) => updatePreference('notifications', v)}
            index={9}
          />
          <SettingsItem
            icon={<Volume2 className="h-[18px] w-[18px]" />}
            label="Sounds & Haptics"
            description="Vibration and subtle sounds"
            onClick={() => setSubPage('sounds')}
            toggle
            toggled={preferences.sound_haptics}
            onToggle={(v) => updatePreference('sound_haptics', v)}
            index={10}
          />
        </SettingsSection>

        {/* 5. Data & Performance */}
        <SettingsSection title="Data & Performance">
          <SettingsItem
            icon={<Wifi className="h-[18px] w-[18px]" />}
            label="Data Usage Mode"
            onClick={cycleDataMode}
            trailing={
              preferences.data_mode === 'low'
                ? 'Low Data'
                : preferences.data_mode === 'offline'
                ? 'Offline'
                : 'Standard'
            }
            index={11}
          />
          <SettingsItem
            icon={<History className="h-[18px] w-[18px]" />}
            label="Chat History Management"
            description="Clear chats, auto-delete"
            onClick={() => setSubPage('chat-history')}
            index={12}
          />
        </SettingsSection>

        {/* 6. Privacy & Legal */}
        <SettingsSection title="Privacy & Legal">
          <SettingsItem
            icon={<Eye className="h-[18px] w-[18px]" />}
            label="Privacy Controls"
            description="Data usage and analytics"
            onClick={() => setSubPage('privacy')}
            index={13}
          />
          <SettingsItem
            icon={<Info className="h-[18px] w-[18px]" />}
            label="About SanGPT"
            description="Version, terms, and developer"
            onClick={() => setSubPage('about')}
            index={14}
          />
        </SettingsSection>

        {/* Sign Out */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<LogOut className="h-[18px] w-[18px]" />}
            label="Sign Out"
            onClick={handleSignOut}
            destructive
            index={15}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
          SanGPT v2.1.0 • Made by Dev-Link
        </p>
      </div>
    </div>
  );
}
