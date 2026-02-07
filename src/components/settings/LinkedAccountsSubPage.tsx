import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { useAuth } from '@/components/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { Mail, Chrome } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function LinkedAccountsSubPage({ onBack }: Props) {
  const { user } = useAuth();
  const { alert } = useAlert();
  const provider = user?.app_metadata?.provider || 'email';

  return (
    <SettingsSubPage title="Linked Accounts" onBack={onBack}>
      <SettingsSection title="Sign-in Methods">
        <SettingsItem
          icon={<Mail className="h-[18px] w-[18px]" />}
          label="Email"
          description={user?.email || 'Not connected'}
          badge={provider === 'email' ? 'Active' : undefined}
          index={0}
        />
        <SettingsItem
          icon={<Chrome className="h-[18px] w-[18px]" />}
          label="Google"
          description={provider === 'google' ? 'Connected' : 'Not connected'}
          badge={provider === 'google' ? 'Active' : undefined}
          onClick={() => {
            if (provider !== 'google') {
              alert({ title: 'Coming Soon', description: 'Google account linking is coming soon.' });
            }
          }}
          index={1}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <p className="text-xs text-muted-foreground">
          You can sign in using any of your linked accounts. Your data is synced across all methods.
        </p>
      </div>
    </SettingsSubPage>
  );
}
