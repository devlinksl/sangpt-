// Lightweight global conversations store — keeps sidebar in sync with the chat
// even when the sidebar is closed. Works without any provider.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  cacheConversations,
  getCachedConversations,
  removeCachedConversation,
  updateCachedConversationTitle,
  type CachedConversation,
} from '@/lib/chatCache';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

type Listener = () => void;

let conversations: Conversation[] = [];
let initializedForUser: string | null = null;
let isLoading = false;
const listeners = new Set<Listener>();

function emit() {
  // Snapshot must be a new array reference for useSyncExternalStore.
  conversations = [...conversations];
  listeners.forEach((l) => l());
}

function sortByUpdated(list: Conversation[]) {
  return [...list].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export const conversationsStore = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return conversations;
  },
  getLoading() {
    return isLoading;
  },
  reset() {
    conversations = [];
    initializedForUser = null;
    emit();
  },
  setAll(list: Conversation[]) {
    conversations = sortByUpdated(list);
    emit();
  },
  upsert(conv: Conversation) {
    const idx = conversations.findIndex((c) => c.id === conv.id);
    const next = [...conversations];
    if (idx >= 0) next[idx] = { ...next[idx], ...conv };
    else next.unshift(conv);
    conversations = sortByUpdated(next);
    emit();
    cacheConversations([conv as CachedConversation]).catch(() => {});
  },
  updateTitle(id: string, title: string) {
    conversations = conversations.map((c) =>
      c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c,
    );
    emit();
    updateCachedConversationTitle(id, title).catch(() => {});
  },
  touch(id: string) {
    conversations = sortByUpdated(
      conversations.map((c) =>
        c.id === id ? { ...c, updated_at: new Date().toISOString() } : c,
      ),
    );
    emit();
  },
  remove(id: string) {
    conversations = conversations.filter((c) => c.id !== id);
    emit();
    removeCachedConversation(id).catch(() => {});
  },
  async load(userId: string, force = false) {
    if (!force && initializedForUser === userId && conversations.length > 0) return;
    initializedForUser = userId;
    // Hydrate from cache instantly
    try {
      const cached = await getCachedConversations(userId);
      if (cached.length > 0) {
        conversations = sortByUpdated(cached);
        emit();
      }
    } catch {
      // Ignore cache errors
    }
    isLoading = true;
    emit();
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      conversations = sortByUpdated(data || []);
      emit();
      cacheConversations((data || []) as CachedConversation[]).catch(() => {});
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      isLoading = false;
      emit();
    }
  },
};

export function useConversations() {
  return useSyncExternalStore(
    conversationsStore.subscribe,
    conversationsStore.getSnapshot,
    conversationsStore.getSnapshot,
  );
}

export function useConversationsLoading() {
  const [loading, setLoading] = useState(isLoading);
  useEffect(() => {
    return conversationsStore.subscribe(() => setLoading(conversationsStore.getLoading()));
  }, []);
  return loading;
}
