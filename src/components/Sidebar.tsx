import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAlert } from '@/hooks/useAlert';
import { ConversationLongPressModal } from '@/components/ConversationLongPressModal';
import {
  cacheConversations,
  getCachedConversations,
  removeCachedConversation,
  updateCachedConversationTitle,
} from '@/lib/chatCache';
import {
  MessageSquare,
  Search,
  Loader2,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onConversationSelect?: (id: string) => void;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Group conversations by date
function groupByDate(conversations: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Earlier', items: [] },
  ];

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    if (d >= today) groups[0].items.push(conv);
    else if (d >= yesterday) groups[1].items.push(conv);
    else if (d >= weekAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter(g => g.items.length > 0);
}

export const Sidebar = ({ isOpen, onClose, onNewChat, onConversationSelect }: SidebarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alert } = useAlert();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showConvLongPress, setShowConvLongPress] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadConversations();
    }
  }, [user, isOpen]);

  const loadConversations = async () => {
    if (!user) return;

    // 1. Load from cache immediately
    try {
      const cached = await getCachedConversations(user.id);
      if (cached.length > 0) {
        setConversations(cached);
      }
    } catch {}

    // 2. Fetch from server in background
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const serverData = data || [];
      setConversations(serverData);
      // Cache for offline use
      cacheConversations(serverData).catch(() => {});
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // If server fails, we already have cache loaded
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const deleteConversation = async (id: string) => {
    // Remove locally immediately
    setConversations(prev => prev.filter(conv => conv.id !== id));
    removeCachedConversation(id).catch(() => {});

    try {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
      alert({ title: "Deleted", description: "Conversation removed", variant: "success" });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert({ title: "Error", description: "Could not delete conversation", variant: "destructive" });
    }
  };

  const updateConversationTitle = async (id: string, newTitle: string) => {
    // Update locally immediately
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
    updateCachedConversationTitle(id, newTitle).catch(() => {});
    setEditingId(null);

    try {
      const { error } = await supabase.from('conversations').update({ title: newTitle }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleTitleSubmit = (id: string) => {
    if (editTitle.trim() && editTitle !== conversations.find(c => c.id === id)?.title) {
      updateConversationTitle(id, editTitle.trim());
    } else {
      setEditingId(null);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      setLoadingConversationId(conversationId);
      onConversationSelect(conversationId);
      setTimeout(() => {
        setLoadingConversationId(null);
        onClose();
      }, 400);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dateGroups = groupByDate(filteredConversations);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-background/95 backdrop-blur-2xl border-r border-border/30 z-50 transform transition-transform duration-200 ease-out animate-slide-in-left shadow-2xl flex flex-col">

        {/* ─── TOP: Search ─── */}

        {/* ─── Search ─── */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        {/* ─── MAIN: Conversations list ─── */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoadingConversations && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {dateGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        editingId={editingId}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSubmitEdit={handleTitleSubmit}
                        onDelete={deleteConversation}
                        onLongPress={() => {
                          setSelectedConvId(conversation.id);
                          setShowConvLongPress(true);
                        }}
                        onSelect={() => handleConversationClick(conversation.id)}
                        isLoading={loadingConversationId === conversation.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── BOTTOM: User Account ─── */}
        {user && (
          <div className="p-3 border-t border-border/20">
            <button
              onClick={() => { navigate('/settings'); onClose(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/40 hover:bg-card/60 transition-all border border-border/20 active:scale-[0.98]"
            >
              <Avatar className="h-10 w-10 bg-primary flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user.user_metadata?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}
      </div>

      <ConversationLongPressModal
        isOpen={showConvLongPress}
        onClose={() => setShowConvLongPress(false)}
        onRename={() => {
          const conv = conversations.find(c => c.id === selectedConvId);
          if (conv) startEditing(conv);
        }}
        onDelete={() => {
          if (selectedConvId) deleteConversation(selectedConvId);
        }}
      />
    </>
  );
};

// ── Swipeable Conversation Item ──

interface ConversationItemProps {
  conversation: Conversation;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  onSubmitEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLongPress: () => void;
  onSelect: () => void;
  isLoading?: boolean;
}

const SWIPE_THRESHOLD = 80;

const ConversationItem = ({
  conversation,
  editingId,
  editTitle,
  setEditTitle,
  onSubmitEdit,
  onDelete,
  onLongPress,
  onSelect,
  isLoading,
}: ConversationItemProps) => {
  const isEditing = editingId === conversation.id;
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const movedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = 0;
    isHorizontalRef.current = null;
    movedRef.current = false;
    setIsSwiping(false);
    longPressTimerRef.current = window.setTimeout(() => onLongPress(), 600);
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // Mark as moved if finger traveled more than 10px in any direction
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      movedRef.current = true;
    }

    if (isHorizontalRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (!isHorizontalRef.current) return;

    const clampedX = Math.min(0, Math.max(dx, -140));
    currentXRef.current = clampedX;
    setSwipeX(clampedX);
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Only trigger select if finger did NOT move (true tap)
    if (!isSwiping && !movedRef.current) {
      onSelect();
      return;
    }

    if (isSwiping && currentXRef.current < -SWIPE_THRESHOLD) {
      setIsDeleting(true);
      setSwipeX(-300);
      setTimeout(() => onDelete(conversation.id), 250);
    } else {
      setSwipeX(0);
    }
    setIsSwiping(false);
  }, [isSwiping, onSelect, onDelete, conversation.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress();
  }, [onLongPress]);

  useEffect(() => {
    if (isEditing) setSwipeX(0);
  }, [isEditing]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-lg w-full">
        <div className={`flex items-center gap-2 transition-opacity duration-150 ${Math.abs(swipeX) > 30 ? 'opacity-100' : 'opacity-0'}`}>
          <Trash2 className="h-4 w-4 text-destructive-foreground" />
          <span className="text-xs font-medium text-destructive-foreground">Delete</span>
        </div>
      </div>

      {/* Foreground */}
      <div
        className={`relative flex items-center gap-3 p-2.5 bg-background rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
          isLoading ? 'opacity-70 pointer-events-none' : ''
        } ${isDeleting ? 'opacity-0' : ''}`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1), opacity 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          if (!('ontouchstart' in window)) onSelect();
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmitEdit(conversation.id);
                if (e.key === 'Escape') onSubmitEdit(conversation.id);
              }}
              onBlur={() => onSubmitEdit(conversation.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm truncate">{conversation.title}</p>
          )}
        </div>
      </div>
    </div>
  );
};
