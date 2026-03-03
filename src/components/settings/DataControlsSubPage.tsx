import { useState, useEffect } from 'react';
import { SettingsSubPage } from './SettingsSubPage';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Save, RotateCcw } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

interface DataControlsSubPageProps {
  onBack: () => void;
}

export function DataControlsSubPage({ onBack }: DataControlsSubPageProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const { alert } = useAlert();
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInstructions(preferences.custom_instructions || '');
  }, [preferences.custom_instructions]);

  const handleSave = async () => {
    setIsSaving(true);
    await updatePreference('custom_instructions', instructions.trim());
    setIsSaving(false);
    alert({ title: 'Saved', description: 'Custom instructions updated', variant: 'success' });
  };

  const handleClear = () => {
    setInstructions('');
  };

  const hasChanges = instructions.trim() !== (preferences.custom_instructions || '');

  return (
    <SettingsSubPage title="Data Controls" onBack={onBack}>
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Custom Instructions</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Set persistent instructions that SanGPT will follow across all your conversations. For example, tell it your preferred language, profession, or how you'd like responses formatted.
            </p>
          </div>

          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Always respond in bullet points. I'm a software developer who prefers concise technical answers..."
            className="min-h-[160px] text-sm bg-background/50 border-border/40 resize-none"
            maxLength={1500}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {instructions.length}/1500
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!instructions}
                className="rounded-full"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="rounded-full"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-2">How it works</h3>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Your instructions are prepended to every conversation automatically.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              They persist across all chats until you change or clear them.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Keep instructions concise for best results (under 500 characters recommended).
            </li>
          </ul>
        </div>
      </div>
    </SettingsSubPage>
  );
}
