import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { Volume2, Vibrate, Music } from 'lucide-react';

interface Props {
  onBack: () => void;
  soundHaptics: boolean;
  onToggleSoundHaptics: (v: boolean) => void;
}

export function SoundsHapticsSubPage({ onBack, soundHaptics, onToggleSoundHaptics }: Props) {
  return (
    <SettingsSubPage title="Sounds & Haptics" onBack={onBack}>
      <SettingsSection title="General">
        <SettingsItem
          icon={<Volume2 className="h-[18px] w-[18px]" />}
          label="All Sounds & Haptics"
          description="Master toggle"
          toggle
          toggled={soundHaptics}
          onToggle={onToggleSoundHaptics}
          index={0}
        />
      </SettingsSection>

      <SettingsSection title="Details">
        <SettingsItem
          icon={<Music className="h-[18px] w-[18px]" />}
          label="Message Sounds"
          description="Play sound when AI responds"
          toggle
          toggled={soundHaptics}
          onToggle={onToggleSoundHaptics}
          index={1}
        />
        <SettingsItem
          icon={<Vibrate className="h-[18px] w-[18px]" />}
          label="Haptic Feedback"
          description="Vibration on button taps"
          toggle
          toggled={soundHaptics}
          onToggle={onToggleSoundHaptics}
          index={2}
        />
      </SettingsSection>
    </SettingsSubPage>
  );
}
