import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  X,
  ArrowLeft,
  Settings,
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) loadConversations();
  }, [user, isOpen]);

  useEffect(() => {
    if (isSearchExpanded) setTimeout(() => searchInputRef.current?.focus(), 300);
    else setSearchTerm('');
  }, [isSearchExpanded]);

  const loadConversations = async () => {
    if (!user) return;
    // Instant from cache
    try {
      const cached = await getCachedConversations(user.id);
      if (cached.length > 0) setConversations(cached);
    } catch {}

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
      cacheConversations(serverData).catch(() => {});
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    removeCachedConversation(id).catch(() => {});
    setDeleteConfirmId(null);
    setContextMenuId(null);
    supabase.from('conversations').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Error deleting conversation:', error);
    });
  };

  const updateConversationTitle = async (id: string, newTitle: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
    updateCachedConversationTitle(id, newTitle).catch(() => {});
    setEditingId(null);
    supabase.from('conversations').update({ title: newTitle }).eq('id', id).then(({ error }) => {
      if (error) console.error('Error updating title:', error);
    });
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
      onConversationSelect(conversationId);
      onClose();
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
      <div
        className={`fixed left-0 top-0 h-full bg-background/95 backdrop-blur-2xl border-r border-border/30 z-50 transform transition-all duration-300 ease-out animate-slide-in-left shadow-2xl flex flex-col ${
          isSearchExpanded ? 'w-full' : 'w-80'
        }`}
      >
        {/* ─── TOP: Search ─── */}
        <div className="px-4 pt-4 pb-2">
          {isSearchExpanded ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchExpanded(false)}
                className="h-9 w-9 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search all conversations..."
                  className="pl-10 h-9 text-sm bg-accent/30 border-border/30 rounded-xl"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl border border-input bg-accent/30 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search conversations...</span>
            </button>
          )}
        </div>

        {/* ─── MIDDLE: Conversations list ─── */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoadingConversations && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{searchTerm ? 'No results found' : 'No conversations yet'}</p>
              {!searchTerm && <p className="text-xs mt-1">Start a new chat to begin</p>}
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
                        onDelete={(id) => setDeleteConfirmId(id)}
                        onLongPress={() => setContextMenuId(conversation.id)}
                        onSelect={() => handleConversationClick(conversation.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── BOTTOM: Account card ─── */}
        {!isSearchExpanded && user && (
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
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-background rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-border/30 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete this chat?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={() => deleteConversation(deleteConfirmId)} className="flex-1 rounded-xl">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Context Menu (Long Press) ─── */}
      {contextMenuId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={() => setContextMenuId(null)}>
          <div className="bg-background rounded-t-2xl w-full max-w-lg pb-safe shadow-2xl border-t border-border/30 animate-slide-in-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-3" />
            <div className="px-2 pb-4">
              <button
                onClick={() => {
                  const conv = conversations.find(c => c.id === contextMenuId);
                  if (conv) { setEditingId(conv.id); setEditTitle(conv.title); }
                  setContextMenuId(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/50 transition-colors text-left"
              >
                <span className="text-sm font-medium">Rename</span>
              </button>
              <button
                onClick={() => { setDeleteConfirmId(contextMenuId); setContextMenuId(null); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/50 transition-colors text-left text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">Delete</span>
              </button>
              <button
                onClick={() => setContextMenuId(null)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/50 transition-colors text-left text-muted-foreground"
              >
                <span className="text-sm font-medium">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
}: ConversationItemProps) => {
  const isEditing = editingId === conversation.id;
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
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
    longPressTimerRef.current = window.setTimeout(() => {
      movedRef.current = true;
      onLongPress();
    }, 600);
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) movedRef.current = true;
    if (isHorizontalRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    }
    if (!isHorizontalRef.current) return;
    const clampedX = Math.min(0, Math.max(dx, -140));
    currentXRef.current = clampedX;
    setSwipeX(clampedX);
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (!isSwiping && !movedRef.current) { onSelect(); return; }
    if (isSwiping && currentXRef.current < -SWIPE_THRESHOLD) { setSwipeX(0); onDelete(conversation.id); }
    else { setSwipeX(0); }
    setIsSwiping(false);
  }, [isSwiping, onSelect, onDelete, conversation.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); onLongPress(); }, [onLongPress]);

  useEffect(() => { if (isEditing) setSwipeX(0); }, [isEditing]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-lg w-full">
        <div className={`flex items-center gap-2 transition-opacity duration-150 ${Math.abs(swipeX) > 30 ? 'opacity-100' : 'opacity-0'}`}>
          <Trash2 className="h-4 w-4 text-destructive-foreground" />
          <span className="text-xs font-medium text-destructive-foreground">Delete</span>
        </div>
      </div>

      <div
        className="relative flex items-center gap-3 p-2.5 bg-background rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={(e) => { if (!('ontouchstart' in window)) onSelect(); }}
      >
        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onSubmitEdit(conversation.id); }}
              onBlur={() => onSubmitEdit(conversation.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-sm w-full bg-background border border-input rounded px-2 outline-none focus:ring-1 focus:ring-ring"
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
