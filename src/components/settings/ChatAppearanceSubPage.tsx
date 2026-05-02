import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Type, AlignVerticalSpaceAround, LayoutGrid, ALargeSmall } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const FONTS = ['sans', 'serif', 'mono', 'rounded'] as const;
const DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
const BUBBLES = ['rounded', 'flat', 'minimal'] as const;
const SIZES = ['small', 'default', 'large', 'xlarge'] as const;
const SIZE_LABEL: Record<typeof SIZES[number], string> = {
  small: 'Small', default: 'Default', large: 'Large', xlarge: 'Extra Large',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ChatAppearanceSubPage({ onBack }: Props) {
  const { preferences, updatePreference } = useUserPreferences();

  const cycle = <T extends string>(arr: readonly T[], current: T): T =>
    arr[(arr.indexOf(current) + 1) % arr.length];

  const cycleFont = () => updatePreference('font_style', cycle(FONTS, (preferences.font_style || 'sans') as any));
  const cycleDensity = () => updatePreference('chat_density', cycle(DENSITIES, (preferences.chat_density || 'comfortable') as any));
  const cycleBubble = () => updatePreference('bubble_style', cycle(BUBBLES, (preferences.bubble_style || 'rounded') as any));
  const cycleSize = () => updatePreference('font_size', cycle(SIZES, (preferences.font_size || 'default') as any));

  return (
    <SettingsSubPage title="Chat Appearance" onBack={onBack}>
      <SettingsSection title="Text">
        <SettingsItem
          icon={<Type className="h-[18px] w-[18px]" />}
          label="Font Style"
          description="Typography for chat content"
          onClick={cycleFont}
          trailing={cap(preferences.font_style || 'sans')}
          index={0}
        />
      </SettingsSection>

      <SettingsSection title="Layout">
        <SettingsItem
          icon={<AlignVerticalSpaceAround className="h-[18px] w-[18px]" />}
          label="Chat Density"
          description="Spacing between messages"
          onClick={cycleDensity}
          trailing={cap(preferences.chat_density || 'comfortable')}
          index={1}
        />
        <SettingsItem
          icon={<LayoutGrid className="h-[18px] w-[18px]" />}
          label="Bubble Style"
          description="Chat bubble appearance"
          onClick={cycleBubble}
          trailing={cap(preferences.bubble_style || 'rounded')}
          index={2}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <p className="text-xs text-muted-foreground">
          Changes apply instantly to all conversations and persist across devices.
        </p>
      </div>
    </SettingsSubPage>
  );
}
