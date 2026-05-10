// Temporary chat storage — stays in IndexedDB/localStorage only,
// auto-purges anything older than 24 hours.

const KEY = 'sangpt-temp-chat';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface TempMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  rating?: number;
  metadata?: any;
}

interface TempChatRecord {
  expires_at: number;
  messages: TempMessage[];
}

export function loadTempChat(): TempMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const rec = JSON.parse(raw) as TempChatRecord;
    if (!rec.expires_at || Date.now() > rec.expires_at) {
      localStorage.removeItem(KEY);
      return [];
    }
    return rec.messages || [];
  } catch {
    return [];
  }
}

export function saveTempChat(messages: TempMessage[]) {
  try {
    const rec: TempChatRecord = {
      expires_at: Date.now() + TTL_MS,
      messages,
    };
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {}
}

export function clearTempChat() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function purgeIfExpired() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const rec = JSON.parse(raw) as TempChatRecord;
    if (!rec.expires_at || Date.now() > rec.expires_at) {
      localStorage.removeItem(KEY);
    }
  } catch {
    localStorage.removeItem(KEY);
  }
}
