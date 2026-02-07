import { useState } from 'react';
import { SettingsSubPage } from './SettingsSubPage';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { useAuth } from '@/components/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Clock, Archive } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function ChatHistorySubPage({ onBack }: Props) {
  const { user } = useAuth();
  const { alert } = useAlert();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    if (!user) return;
    setClearing(true);
    try {
      // Delete messages first (foreign key), then conversations
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (convos && convos.length > 0) {
        const ids = convos.map((c) => c.id);
        await supabase.from('messages').delete().in('conversation_id', ids);
        await supabase.from('conversations').delete().eq('user_id', user.id);
      }

      alert({ title: 'Done', description: 'All chat history has been cleared.', variant: 'success' });
    } catch (err: any) {
      alert({ title: 'Error', description: err?.message || 'Failed to clear history.', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <SettingsSubPage title="Chat History" onBack={onBack}>
      <SettingsSection title="Actions">
        <SettingsItem
          icon={<Trash2 className="h-[18px] w-[18px]" />}
          label={clearing ? 'Clearing…' : 'Clear All Chats'}
          description="Permanently delete all conversations"
          onClick={handleClearAll}
          destructive
          index={0}
        />
      </SettingsSection>

      <SettingsSection title="Auto-Management">
        <SettingsItem
          icon={<Clock className="h-[18px] w-[18px]" />}
          label="Auto-Delete"
          description="Automatically remove old chats"
          onClick={() => alert({ title: 'Coming Soon', description: 'Auto-delete is coming in a future update.' })}
          index={1}
        />
        <SettingsItem
          icon={<Archive className="h-[18px] w-[18px]" />}
          label="Export Chats"
          description="Download your chat history"
          onClick={() => alert({ title: 'Coming Soon', description: 'Chat export is coming soon.' })}
          index={2}
        />
      </SettingsSection>
    </SettingsSubPage>
  );
}
