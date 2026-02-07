import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';

export interface UserPreferences {
  theme: string;
  response_style: string;
  typing_speed: string;
  data_mode: string;
  animations: boolean;
  new_chat_auto: boolean;
  notifications: boolean;
  sound_haptics: boolean;
  analytics_opt_out: boolean;
  auto_speech: boolean;
  voice_preference: string;
}

const DEFAULT_PREFS: UserPreferences = {
  theme: 'system',
  response_style: 'balanced',
  typing_speed: 'normal',
  data_mode: 'standard',
  animations: true,
  new_chat_auto: true,
  notifications: true,
  sound_haptics: true,
  analytics_opt_out: false,
  auto_speech: false,
  voice_preference: 'alloy',
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  // Load preferences from DB
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFS);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            theme: data.theme ?? DEFAULT_PREFS.theme,
            response_style: (data as any).response_style ?? DEFAULT_PREFS.response_style,
            typing_speed: (data as any).typing_speed ?? DEFAULT_PREFS.typing_speed,
            data_mode: (data as any).data_mode ?? DEFAULT_PREFS.data_mode,
            animations: (data as any).animations ?? DEFAULT_PREFS.animations,
            new_chat_auto: (data as any).new_chat_auto ?? DEFAULT_PREFS.new_chat_auto,
            notifications: (data as any).notifications ?? DEFAULT_PREFS.notifications,
            sound_haptics: (data as any).sound_haptics ?? DEFAULT_PREFS.sound_haptics,
            analytics_opt_out: (data as any).analytics_opt_out ?? DEFAULT_PREFS.analytics_opt_out,
            auto_speech: data.auto_speech ?? DEFAULT_PREFS.auto_speech,
            voice_preference: data.voice_preference ?? DEFAULT_PREFS.voice_preference,
          });
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Update a single preference
  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      // Optimistic update
      setPreferences((prev) => ({ ...prev, [key]: value }));

      if (!user) return;

      try {
        const { error } = await supabase
          .from('user_preferences')
          .update({ [key]: value } as any)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error(`Failed to save preference "${key}":`, err);
      }
    },
    [user]
  );

  return { preferences, loading, updatePreference };
}
