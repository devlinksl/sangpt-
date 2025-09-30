import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  Edit3, 
  Grid3x3, 
  Send, 
  Mic, 
  Paperclip, 
  Plus, 
  Sun, 
  Moon, 
  Settings
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  onOpenSidebar: () => void;
}

const EXAMPLE_PROMPTS = [
  "Write a first draft",
  "Get advice", 
  "Learn something new"
];

export const ChatInterface = ({ onOpenSidebar }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: user.id, title: 'New conversation' }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Show auth modal if user is not signed in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // Create new conversation if none exists
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (!conversationId) {
          throw new Error('Failed to create conversation');
        }
        setCurrentConversationId(conversationId);
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Save user message to database
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: 'user',
          content: messageText,
        }]);

      if (userMessageError) throw userMessageError;

      // Simulate AI response (replace with actual AI integration later)
      setTimeout(async () => {
        const responses = [
          "I understand your question. As an AI assistant, I'm here to help you with various tasks. Could you please provide more specific details about what you'd like assistance with?",
          "That's an interesting request! I'd be happy to help you with that. Let me break this down for you...",
          "Great question! Based on what you've asked, here are some thoughts and suggestions...",
          "I can definitely help you with that. Let me provide you with a comprehensive response...",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: randomResponse,
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save AI response to database
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            role: 'assistant',
            content: randomResponse,
          }]);

        setIsLoading(false);
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-ai-light-blue to-ai-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {messages.length > 0 ? 'New conversation' : 'Copilot'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon">
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Edit3 className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                  {user.email?.charAt(0).toUpperCase() || 'W'}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6"
            >
              Sign up
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  {user ? `Hi ${user.email?.split('@')[0]}, what's new?` : "What can I help with?"}
                </h2>
              </div>

              {/* Example Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleExamplePrompt(prompt)}
                    className="p-4 h-auto text-left bg-white/50 hover:bg-white/80 border border-gray-200 rounded-xl"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>

              {!user && (
                <div className="mt-8">
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-full"
                  >
                    Sign up to get started
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-ai-blue text-gray-900'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.content}
                </div>

                {message.role === 'user' && user && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                  <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/10 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Copilot"
                className="pr-20 py-3 bg-white border-gray-200 rounded-2xl resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 w-12"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Quick response
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};