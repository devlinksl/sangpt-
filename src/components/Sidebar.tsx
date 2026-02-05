import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
 import { useAlert } from '@/hooks/useAlert';
import { ConversationLongPressModal } from '@/components/ConversationLongPressModal';
import { ShimmerLoading } from '@/components/ShimmerLoading';
import {
  X,
  MessageSquare,
  Grid3x3,
  Settings,
  HelpCircle,
  Trash2,
  Search,
  Plus,
  Pin,
  PinOff,
  Edit2,
  History,
  Sparkles,
  ChevronRight,
  Mail
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
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen]);

  const fetchConversations = async () => {
    if (!user) return;

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

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(conv => conv.pinned);
  const regularConversations = filteredConversations.filter(conv => !conv.pinned);

  if (!isOpen) return null;

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
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group transition-all duration-200"
                >
                  <div className="p-2 bg-ai-blue/20 rounded-lg">
                    <item.icon className="h-5 w-5 text-ai-blue" />
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
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
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
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
            {/* New Chat Button */}
            <div className="p-4 border-b border-border">
              <Button 
                onClick={() => {
                  onNewChat?.();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-ai-blue to-ai-purple hover:opacity-90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

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

                <div className="px-4 pb-20 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {loadingConversation ? (
                    <div className="space-y-4 p-4">
                      <ShimmerLoading />
                      <ShimmerLoading />
                      <ShimmerLoading />
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
                              onSelect={() => {
                                if (onConversationSelect) {
                                  setLoadingConversation(true);
                                  onConversationSelect(conversation.id);
                                  onClose();
                                  setTimeout(() => setLoadingConversation(false), 500);
                                }
                              }}
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
                              onSelect={() => {
                                if (onConversationSelect) {
                                  setLoadingConversation(true);
                                  onConversationSelect(conversation.id);
                                  onClose();
                                  setTimeout(() => setLoadingConversation(false), 500);
                                }
                              }}
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-chat-sidebar dark:bg-gray-900 border-r border-border z-50 transform transition-transform duration-300 ease-in-out animate-slide-in-left">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">SanGPT</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-gradient-to-br from-ai-blue to-ai-purple">
                  <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'W'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.email?.split('@')[0] || 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="border-b border-border">
            <div className="flex">
              {[
                { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
                { id: 'explore' as const, icon: Grid3x3, label: 'Explore' },
                { id: 'settings' as const, icon: Settings, label: 'Settings' },
                { id: 'help' as const, icon: HelpCircle, label: 'Help' },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex-1 rounded-none ${
                    activeSection === item.id 
                      ? 'bg-ai-blue/10 text-ai-blue border-b-2 border-ai-blue' 
                      : ''
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>

          {/* Footer */}
          {user && (
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full"
              >
                Sign out
              </Button>
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
          // TODO: Implement pinning
           alert({ title: "Coming Soon", description: "Pin feature coming soon" });
        }}
        onDelete={() => {
          if (selectedConvId) deleteConversation(selectedConvId);
        }}
      />
    </>
  );
};

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
}

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
}: ConversationItemProps) => {
  const isEditing = editingId === conversation.id;

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    const timer = setTimeout(() => onLongPress(), 2000);
    if ('touches' in e) {
      (e.currentTarget as HTMLElement).dataset.timer = String(timer);
    }
  };

  const handleLongPressEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const timer = (e.currentTarget as HTMLElement).dataset.timer;
    if (timer) clearTimeout(Number(timer));
  };

  return (
    <div 
      className="group flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-all duration-200"
      onClick={onSelect}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
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
  );
};