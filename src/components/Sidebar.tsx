import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  X,
  MessageSquare,
  Grid3x3,
  Settings,
  HelpCircle,
  Trash2,
  Search,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-chat-sidebar border-r border-border z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Conversations</h2>
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
          <div className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="h-5 w-5 mr-3" />
              Chat
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Grid3x3 className="h-5 w-5 mr-3" />
              Explore
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="h-5 w-5 mr-3" />
              Help
            </Button>
          </div>

          {/* Conversations */}
          {user && (
            <div className="flex-1 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">Recent Conversations</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
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

              <div className="px-4 pb-4 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new chat to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="group flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conversation.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(conversation.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
    </>
  );
};