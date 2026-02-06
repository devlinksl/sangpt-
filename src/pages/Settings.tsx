import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { useAlert } from '@/hooks/useAlert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ProfileInfoSubPage } from '@/components/settings/ProfileInfoSubPage';
import { AboutSubPage } from '@/components/settings/AboutSubPage';
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

type SubPage = 'main' | 'profile' | 'about';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { alert } = useAlert();

  const [subPage, setSubPage] = useState<SubPage>('main');

  // Local state for toggles
  const [animations, setAnimations] = useState(true);
  const [newChatAuto, setNewChatAuto] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundHaptics, setSoundHaptics] = useState(true);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);

  // Local state for selections
  const [responseStyle, setResponseStyle] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [typingSpeed, setTypingSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [dataMode, setDataMode] = useState<'standard' | 'low' | 'offline'>('standard');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const cycleResponseStyle = () => {
    const next = responseStyle === 'concise' ? 'balanced' : responseStyle === 'balanced' ? 'detailed' : 'concise';
    setResponseStyle(next);
  };

  const cycleTypingSpeed = () => {
    const next = typingSpeed === 'slow' ? 'normal' : typingSpeed === 'normal' ? 'fast' : 'slow';
    setTypingSpeed(next);
  };

  const cycleDataMode = () => {
    const next = dataMode === 'standard' ? 'low' : dataMode === 'low' ? 'offline' : 'standard';
    setDataMode(next);
  };

  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';
  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  // Render sub-pages
  if (subPage === 'profile') return <ProfileInfoSubPage onBack={() => setSubPage('main')} />;
  if (subPage === 'about') return <AboutSubPage onBack={() => setSubPage('main')} />;

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
              {user?.user_metadata?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email || 'Sign in to access settings'}</p>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 shrink-0" />
        </div>

        {/* === 1. Account & Profile === */}
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
            onClick={() => alert({ title: 'Coming Soon', description: 'Security settings are being built.' })}
            index={1}
          />
          <SettingsItem
            icon={<Link2 className="h-[18px] w-[18px]" />}
            label="Linked Accounts"
            description="Google and email sign-in"
            onClick={() => alert({ title: 'Coming Soon', description: 'Account linking is coming soon.' })}
            index={2}
          />
        </SettingsSection>

        {/* === 2. Appearance & Experience === */}
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
            onClick={() => alert({ title: 'Coming Soon', description: 'Chat appearance customization coming soon.' })}
            index={4}
          />
          <SettingsItem
            icon={<Sparkles className="h-[18px] w-[18px]" />}
            label="Animations & Smoothness"
            description="Enhanced visual effects"
            toggle
            toggled={animations}
            onToggle={setAnimations}
            index={5}
          />
        </SettingsSection>

        {/* === 3. AI & Chat Behavior === */}
        <SettingsSection title="AI & Chat Behavior">
          <SettingsItem
            icon={<BrainCircuit className="h-[18px] w-[18px]" />}
            label="AI Response Style"
            onClick={cycleResponseStyle}
            trailing={responseStyle.charAt(0).toUpperCase() + responseStyle.slice(1)}
            index={6}
          />
          <SettingsItem
            icon={<Gauge className="h-[18px] w-[18px]" />}
            label="Typing Speed"
            description="Typewriter effect speed"
            onClick={cycleTypingSpeed}
            trailing={typingSpeed.charAt(0).toUpperCase() + typingSpeed.slice(1)}
            index={7}
          />
          <SettingsItem
            icon={<MessageCirclePlus className="h-[18px] w-[18px]" />}
            label="New Chat Behavior"
            description="Auto-create on first message"
            toggle
            toggled={newChatAuto}
            onToggle={setNewChatAuto}
            index={8}
          />
        </SettingsSection>

        {/* === 4. Notifications & Sound === */}
        <SettingsSection title="Notifications & Sound">
          <SettingsItem
            icon={<Bell className="h-[18px] w-[18px]" />}
            label="Notifications"
            description="Messages, updates, and alerts"
            toggle
            toggled={notifications}
            onToggle={setNotifications}
            index={9}
          />
          <SettingsItem
            icon={<Volume2 className="h-[18px] w-[18px]" />}
            label="Sounds & Haptics"
            description="Vibration and subtle sounds"
            toggle
            toggled={soundHaptics}
            onToggle={setSoundHaptics}
            index={10}
          />
        </SettingsSection>

        {/* === 5. Data & Performance === */}
        <SettingsSection title="Data & Performance">
          <SettingsItem
            icon={<Wifi className="h-[18px] w-[18px]" />}
            label="Data Usage Mode"
            onClick={cycleDataMode}
            trailing={dataMode === 'low' ? 'Low Data' : dataMode === 'offline' ? 'Offline' : 'Standard'}
            index={11}
          />
          <SettingsItem
            icon={<History className="h-[18px] w-[18px]" />}
            label="Chat History Management"
            description="Clear chats, auto-delete"
            onClick={() => alert({ title: 'Coming Soon', description: 'History management is coming soon.' })}
            index={12}
          />
        </SettingsSection>

        {/* === 6. Privacy & Legal === */}
        <SettingsSection title="Privacy & Legal">
          <SettingsItem
            icon={<Eye className="h-[18px] w-[18px]" />}
            label="Privacy Controls"
            description="Data usage and analytics"
            toggle
            toggled={!analyticsOptOut}
            onToggle={(v) => setAnalyticsOptOut(!v)}
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
