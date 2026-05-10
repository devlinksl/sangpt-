import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { AIStylePreview } from './AIStylePreview';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Type, AlignVerticalSpaceAround, LayoutGrid, ALargeSmall, Sparkles, Zap, Maximize2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const FONTS = ['sans', 'serif', 'mono', 'rounded'] as const;
const DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
const BUBBLES = ['rounded', 'flat', 'minimal'] as const;
const SIZES = ['small', 'default', 'large', 'xlarge'] as const;
const AI_STYLES = ['chatgpt', 'gemini', 'claude', 'dev', 'minimal', 'edu', 'creative'] as const;
const ANIM = ['off', 'low', 'medium', 'high'] as const;
const WIDTHS = ['narrow', 'standard', 'full'] as const;

const SIZE_LABEL: Record<typeof SIZES[number], string> = {
  small: 'Small', default: 'Default', large: 'Large', xlarge: 'Extra Large',
};
const AI_LABEL: Record<typeof AI_STYLES[number], string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', dev: 'Developer',
  minimal: 'Minimal', edu: 'Educational', creative: 'Creative',
};
const FONT_LABEL: Record<typeof FONTS[number], string> = {
  sans: 'Söhne (Sans)', serif: 'Serif', mono: 'Mono', rounded: 'Rounded',
};
const WIDTH_LABEL: Record<typeof WIDTHS[number], string> = {
  narrow: 'Narrow', standard: 'Standard', full: 'Full Width',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ChatAppearanceSubPage({ onBack }: Props) {
  const { preferences, updatePreference } = useUserPreferences();

  const cycle = <T extends string>(arr: readonly T[], current: T): T =>
    arr[(arr.indexOf(current) + 1) % arr.length];

  return (
    <SettingsSubPage title="Appearance" onBack={onBack}>
      <SettingsSection title="Text">
        <SettingsItem
          icon={<Type className="h-[18px] w-[18px]" />}
          label="Font Family"
          description="Typography across the app"
          onClick={() => updatePreference('font_style', cycle(FONTS, (preferences.font_style || 'sans') as any))}
          trailing={FONT_LABEL[(preferences.font_style || 'sans') as typeof FONTS[number]] || 'Sans'}
          index={0}
        />
        <SettingsItem
          icon={<ALargeSmall className="h-[18px] w-[18px]" />}
          label="Font Size"
          description="Text size scale"
          onClick={() => updatePreference('font_size', cycle(SIZES, (preferences.font_size || 'default') as any))}
          trailing={SIZE_LABEL[(preferences.font_size || 'default') as typeof SIZES[number]] || 'Default'}
          index={1}
        />
      </SettingsSection>

      <SettingsSection title="Layout">
        <SettingsItem
          icon={<AlignVerticalSpaceAround className="h-[18px] w-[18px]" />}
          label="Chat Density"
          description="Spacing between messages"
          onClick={() => updatePreference('chat_density', cycle(DENSITIES, (preferences.chat_density || 'comfortable') as any))}
          trailing={cap(preferences.chat_density || 'comfortable')}
          index={0}
        />
        <SettingsItem
          icon={<LayoutGrid className="h-[18px] w-[18px]" />}
          label="Bubble Style"
          description="Chat bubble appearance"
          onClick={() => updatePreference('bubble_style', cycle(BUBBLES, (preferences.bubble_style || 'rounded') as any))}
          trailing={cap(preferences.bubble_style || 'rounded')}
          index={1}
        />
        <SettingsItem
          icon={<Maximize2 className="h-[18px] w-[18px]" />}
          label="Response Width"
          description="Reading width for AI replies"
          onClick={() => updatePreference('response_width', cycle(WIDTHS, (preferences.response_width || 'standard') as any))}
          trailing={WIDTH_LABEL[(preferences.response_width || 'standard') as typeof WIDTHS[number]]}
          index={2}
        />
      </SettingsSection>

      <SettingsSection title="AI Response Style">
        <SettingsItem
          icon={<Sparkles className="h-[18px] w-[18px]" />}
          label="Rendering Preset"
          description="How AI responses are formatted"
          onClick={() => updatePreference('ai_response_style', cycle(AI_STYLES, (preferences.ai_response_style || 'chatgpt') as any))}
          trailing={AI_LABEL[(preferences.ai_response_style || 'chatgpt') as typeof AI_STYLES[number]]}
          index={0}
        />
        <SettingsItem
          icon={<Zap className="h-[18px] w-[18px]" />}
          label="Animation Intensity"
          description="Motion across the interface"
          onClick={() => updatePreference('animation_intensity', cycle(ANIM, (preferences.animation_intensity || 'medium') as any))}
          trailing={cap(preferences.animation_intensity || 'medium')}
          index={1}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <p className="text-xs text-muted-foreground">
          Changes apply instantly across all conversations and sync to your other devices.
        </p>
      </div>
    </SettingsSubPage>
  );
}
