import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAlert } from '@/hooks/useAlert';
import { ConversationLongPressModal } from '@/components/ConversationLongPressModal';
import {
  MessageSquare,
  Grid3x3,
  Settings,
  HelpCircle,
  Search,
  Pin,
  Loader2,
  ChevronRight,
  History,
  Sparkles,
  Mail,
  Trash2,
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
  pinned?: boolean;
}

const exploreItems = [
  { icon: MessageSquare, title: "Chat with AI", description: "Start a conversation" },
  { icon: Sparkles, title: "Generate Image", description: "Create AI artwork" },
  { icon: History, title: "Deep Research", description: "Comprehensive analysis" },
  { icon: Settings, title: "Voice Chat", description: "Speak with AI" },
  { icon: Mail, title: "Contact Us", description: "Get in touch", path: '/contact' },
];

export const Sidebar = ({ isOpen, onClose, onNewChat, onConversationSelect }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { alert } = useAlert();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'chat' | 'explore' | 'settings' | 'help'>('chat');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showConvLongPress, setShowConvLongPress] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen]);

  const fetchConversations = async () => {
    if (!user) return;
    setIsLoadingConversations(true);

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      alert({
        title: "Conversation deleted",
        description: "The conversation has been removed",
        variant: "success",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert({
        title: "Error",
        description: "Could not delete conversation",
        variant: "destructive",
      });
    }
  };

  const updateConversationTitle = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', id);

      if (error) throw error;
      
      setConversations(prev => prev.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      ));
      setEditingId(null);
      
      alert({
        title: "Title updated",
        description: "Conversation title has been changed",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating title:', error);
      alert({
        title: "Error",
        description: "Could not update title",
        variant: "destructive",
      });
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
      // Give time for chat to load, then close sidebar
      setTimeout(() => {
        setLoadingConversationId(null);
        onClose();
      }, 600);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(conv => conv.pinned);
  const regularConversations = filteredConversations.filter(conv => !conv.pinned);

  if (!isOpen) return null;

  // ── Top navigation buttons ──
  const navButtons = [
    { id: 'chat' as const, icon: MessageSquare, tooltip: 'Chats' },
    { id: 'explore' as const, icon: Grid3x3, tooltip: 'Explore' },
    { id: 'settings' as const, icon: Settings, tooltip: 'Settings' },
    { id: 'help' as const, icon: HelpCircle, tooltip: 'Help' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'explore':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Explore AI Features</h3>
            <div className="space-y-3">
              {exploreItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    navigate(item.path || '/explore');
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg hover:bg-card/80 cursor-pointer group transition-all duration-200 border border-border/30"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Settings</h3>
            <div className="space-y-3">
              <div 
                onClick={() => {
                  navigate('/settings');
                  onClose();
                }}
                className="p-3 bg-card/50 backdrop-blur-sm rounded-lg hover:bg-card/80 cursor-pointer transition-colors border border-border/30"
              >
                <h4 className="font-medium mb-2">All Settings</h4>
                <p className="text-sm text-muted-foreground">Theme, voice, privacy, and more</p>
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Help & Support</h3>
            <div className="space-y-3">
              <div 
                onClick={() => {
                  navigate('/help');
                  onClose();
                }}
                className="p-3 bg-card/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-card/80 transition-colors border border-border/30"
              >
                <h4 className="font-medium">View All Help Topics</h4>
                <p className="text-sm text-muted-foreground">Getting started, shortcuts, and FAQs</p>
              </div>
            </div>
          </div>
        );

      default: // chat
        return (
          <>
            {/* Conversations */}
            {user && (
              <div className="flex-1 overflow-hidden">
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="px-4 pb-20 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {isLoadingConversations ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a new chat to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Pinned Conversations */}
                      {pinnedConversations.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <Pin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pinned</span>
                          </div>
                          {pinnedConversations.map((conversation) => (
                            <ConversationItem
                              key={conversation.id}
                              conversation={conversation}
                              editingId={editingId}
                              editTitle={editTitle}
                              setEditTitle={setEditTitle}
                              onStartEdit={startEditing}
                              onSubmitEdit={handleTitleSubmit}
                              onDelete={deleteConversation}
                              onPin={() => {}}
                              onLongPress={() => {
                                setSelectedConvId(conversation.id);
                                setShowConvLongPress(true);
                              }}
                              onSelect={() => handleConversationClick(conversation.id)}
                              isLoading={loadingConversationId === conversation.id}
                            />
                          ))}
                        </div>
                      )}

                      {/* Regular Conversations */}
                      {regularConversations.length > 0 && (
                        <div>
                          {pinnedConversations.length > 0 && (
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent</span>
                            </div>
                          )}
                          {regularConversations.map((conversation) => (
                            <ConversationItem
                              key={conversation.id}
                              conversation={conversation}
                              editingId={editingId}
                              editTitle={editTitle}
                              setEditTitle={setEditTitle}
                              onStartEdit={startEditing}
                              onSubmitEdit={handleTitleSubmit}
                              onDelete={deleteConversation}
                              onPin={() => {}}
                              onLongPress={() => {
                                setSelectedConvId(conversation.id);
                                setShowConvLongPress(true);
                              }}
                              onSelect={() => handleConversationClick(conversation.id)}
                              isLoading={loadingConversationId === conversation.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <>
      {/* Backdrop — tapping closes sidebar */}
      <div 
        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-background/50 backdrop-blur-2xl backdrop-saturate-150 border-r border-border/30 z-50 transform transition-transform duration-200 ease-out animate-slide-in-left shadow-2xl">
        <div className="flex flex-col h-full">

          {/* Top Action Buttons — 4 horizontal, evenly spaced */}
          <div className="border-b border-border/30">
            <div className="flex">
              {navButtons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 relative ${
                    activeSection === item.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={item.tooltip}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.tooltip}</span>
                  {/* Active indicator bar */}
                  {activeSection === item.id && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>

          {/* Footer — User Account Button → navigates to Settings */}
          {user && (
            <div className="p-4 border-t border-border/30">
              <button
                onClick={() => {
                  navigate('/settings');
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all border border-border/20 active:scale-[0.98]"
              >
                <Avatar className="h-9 w-9 bg-primary flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
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
      </div>

      <ConversationLongPressModal 
        isOpen={showConvLongPress}
        onClose={() => setShowConvLongPress(false)}
        isPinned={conversations.find(c => c.id === selectedConvId)?.pinned || false}
        onRename={() => {
          const conv = conversations.find(c => c.id === selectedConvId);
          if (conv) startEditing(conv);
        }}
        onPin={() => {
          alert({ title: "Coming Soon", description: "Pin feature coming soon" });
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
  onStartEdit: (conversation: Conversation) => void;
  onSubmitEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
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
  onStartEdit,
  onSubmitEdit,
  onDelete,
  onPin,
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = 0;
    isHorizontalRef.current = null;
    setIsSwiping(false);

    // Start long press timer
    longPressTimerRef.current = window.setTimeout(() => onLongPress(), 2000);
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // Determine direction on first significant move
    if (isHorizontalRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      // Cancel long press on any move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (!isHorizontalRef.current) return;

    // Only allow swiping left (negative dx)
    const clampedX = Math.min(0, Math.max(dx, -140));
    currentXRef.current = clampedX;
    setSwipeX(clampedX);
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Cancel long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isSwiping) {
      // It was a tap, not a swipe
      if (Math.abs(currentXRef.current) < 10) {
        onSelect();
      }
      return;
    }

    if (currentXRef.current < -SWIPE_THRESHOLD) {
      // Commit delete
      setIsDeleting(true);
      setSwipeX(-300);
      setTimeout(() => {
        onDelete(conversation.id);
      }, 250);
    } else {
      // Snap back
      setSwipeX(0);
    }
    setIsSwiping(false);
  }, [isSwiping, onSelect, onDelete, conversation.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress();
  }, [onLongPress]);

  // Reset swipe when editing starts
  useEffect(() => {
    if (isEditing) setSwipeX(0);
  }, [isEditing]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-lg w-full">
        <div className={`flex items-center gap-2 transition-opacity duration-150 ${Math.abs(swipeX) > 30 ? 'opacity-100' : 'opacity-0'}`}>
          <Trash2 className="h-4 w-4 text-destructive-foreground" />
          <span className="text-xs font-medium text-destructive-foreground">Delete</span>
        </div>
      </div>

      {/* Swipeable foreground */}
      <div
        className={`relative flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer border border-transparent hover:border-border/30 ${
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
          // Desktop click (touch handled in touchEnd)
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSubmitEdit(conversation.id);
                } else if (e.key === 'Escape') {
                  onSubmitEdit(conversation.id);
                }
              }}
              onBlur={() => onSubmitEdit(conversation.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-8 text-sm"
              autoFocus
            />
          ) : (
            <>
              <p className="font-medium truncate">{conversation.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
