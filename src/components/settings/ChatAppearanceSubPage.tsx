import { useState } from 'react';
import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { useAlert } from '@/hooks/useAlert';
import { Type, AlignVerticalSpaceAround, LayoutGrid } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function ChatAppearanceSubPage({ onBack }: Props) {
  const { alert } = useAlert();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  const cycleFontSize = () => {
    const next = fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : 'small';
    setFontSize(next);
  };

  const cycleDensity = () => {
    const next = density === 'compact' ? 'comfortable' : density === 'comfortable' ? 'spacious' : 'compact';
    setDensity(next);
  };

  return (
    <SettingsSubPage title="Chat Appearance" onBack={onBack}>
      <SettingsSection title="Text">
        <SettingsItem
          icon={<Type className="h-[18px] w-[18px]" />}
          label="Font Size"
          description="Adjust chat text size"
          onClick={cycleFontSize}
          trailing={fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
          index={0}
        />
      </SettingsSection>

      <SettingsSection title="Layout">
        <SettingsItem
          icon={<AlignVerticalSpaceAround className="h-[18px] w-[18px]" />}
          label="Chat Density"
          description="Spacing between messages"
          onClick={cycleDensity}
          trailing={density.charAt(0).toUpperCase() + density.slice(1)}
          index={1}
        />
        <SettingsItem
          icon={<LayoutGrid className="h-[18px] w-[18px]" />}
          label="Bubble Style"
          description="Chat bubble appearance"
          onClick={() => alert({ title: 'Coming Soon', description: 'Bubble style customization coming soon.' })}
          index={2}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <p className="text-xs text-muted-foreground">
          Changes to chat appearance will apply to all conversations.
        </p>
      </div>
    </SettingsSubPage>
  );
}
