import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { Eye, BarChart3, Database } from 'lucide-react';

interface Props {
  onBack: () => void;
  analyticsOptOut: boolean;
  onToggleAnalytics: (v: boolean) => void;
}

export function PrivacyControlsSubPage({ onBack, analyticsOptOut, onToggleAnalytics }: Props) {
  return (
    <SettingsSubPage title="Privacy Controls" onBack={onBack}>
      <SettingsSection title="Data & Analytics">
        <SettingsItem
          icon={<BarChart3 className="h-[18px] w-[18px]" />}
          label="Usage Analytics"
          description="Help improve SanGPT with anonymous data"
          toggle
          toggled={!analyticsOptOut}
          onToggle={(v) => onToggleAnalytics(!v)}
          index={0}
        />
        <SettingsItem
          icon={<Database className="h-[18px] w-[18px]" />}
          label="Chat Data Usage"
          description="Your chats are encrypted and private"
          index={1}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            SanGPT respects your privacy. Your conversations are encrypted and never shared with third parties.
          </p>
        </div>
      </div>
    </SettingsSubPage>
  );
}
