import { useState } from 'react';
import { SettingsSubPage } from './SettingsSubPage';
import { SettingsItem } from './SettingsItem';
import { SettingsSection } from './SettingsSection';
import { useAuth } from '@/components/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Fingerprint, KeyRound } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function AccountSecuritySubPage({ onBack }: Props) {
  const { user } = useAuth();
  const { alert } = useAlert();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      alert({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert({ title: 'Success', description: 'Password updated successfully.', variant: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert({ title: 'Error', description: err?.message || 'Failed to update password.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSubPage title="Account Security" onBack={onBack}>
      <SettingsSection title="Change Password">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="glass-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="glass-input rounded-xl"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={loading} className="w-full rounded-xl h-11">
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Security Options">
        <SettingsItem
          icon={<Fingerprint className="h-[18px] w-[18px]" />}
          label="Biometric Lock"
          description="Use fingerprint or face to unlock"
          onClick={() => alert({ title: 'Coming Soon', description: 'Biometric lock requires a native app.', variant: 'default' })}
          index={0}
        />
        <SettingsItem
          icon={<KeyRound className="h-[18px] w-[18px]" />}
          label="PIN Lock"
          description="Set a 4-digit app PIN"
          onClick={() => alert({ title: 'Coming Soon', description: 'PIN lock is coming in a future update.', variant: 'default' })}
          index={1}
        />
      </SettingsSection>

      <div className="glass-card rounded-2xl p-4 mt-2">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Your account is protected with industry-standard encryption.
          </p>
        </div>
      </div>
    </SettingsSubPage>
  );
}
