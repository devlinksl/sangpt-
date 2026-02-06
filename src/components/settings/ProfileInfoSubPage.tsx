import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { supabase } from '@/integrations/supabase/client';
import { SettingsSubPage } from './SettingsSubPage';
import { Camera } from 'lucide-react';

interface ProfileInfoSubPageProps {
  onBack: () => void;
}

export function ProfileInfoSubPage({ onBack }: ProfileInfoSubPageProps) {
  const { user } = useAuth();
  const { alert } = useAlert();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) throw error;
      alert({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' });
    } catch {
      alert({ title: 'Error', description: 'Could not update profile.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSubPage title="Profile Information" onBack={onBack}>
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          <Avatar className="h-24 w-24 bg-gradient-to-br from-ai-blue to-ai-purple">
            <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white text-3xl font-semibold">
              {user?.user_metadata?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
          <Input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            className="glass-input rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input value={user?.email || ''} disabled className="rounded-xl bg-muted/50" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full rounded-xl h-11">
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </SettingsSubPage>
  );
}
