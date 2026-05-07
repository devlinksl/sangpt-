import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAlert } from '@/hooks/useAlert';
import { humanizeError } from '@/lib/humanizeError';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const { alert } = useAlert();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase session arrives in URL hash as type=recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    setTimeout(() => setReady(true), 600);
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      alert({ title: 'Passwords don\'t match', description: '', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert({ title: 'Password updated', description: 'You\'re all set.', variant: 'success' });
      navigate('/');
    } catch (e: any) {
      alert({ title: 'Could not update', description: humanizeError(e) ?? e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose something secure you'll remember.</p>
        </div>
        <div className="space-y-2">
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" disabled={!ready} />
        </div>
        <div className="space-y-2">
          <Label>Confirm password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-xl" disabled={!ready} />
        </div>
        <Button type="submit" disabled={loading || !ready} className="w-full h-14 rounded-full bg-foreground text-background hover:bg-foreground/90">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
