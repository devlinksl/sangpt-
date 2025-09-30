import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { SpeechToText } from '@/components/SpeechToText';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  Edit3, 
  Grid3x3, 
  Send, 
  Paperclip, 
  Plus,
  Sun, 
  Moon,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  rating: number;
  metadata?: any;
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

  const sendMessage = async (messageText: string, isRegeneration = false) => {
    if (!messageText.trim() && !isRegeneration) return;

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

      let userMessage: Message | null = null;

      // Add user message to UI if not regeneration
      if (!isRegeneration) {
        userMessage = {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content: messageText,
          created_at: new Date().toISOString(),
          rating: 0,
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
      }

      // Prepare messages for AI
      const messagesToSend = isRegeneration 
        ? messages.filter(m => m.role === 'user')
        : [...messages.filter(m => m.role === 'user'), ...(userMessage ? [userMessage] : [])];

      // Call AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: messagesToSend.map(m => ({ role: m.role, content: m.content })),
          conversationId 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.response;
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString(),
        rating: 0,
      };

      // If regeneration, replace last assistant message, otherwise add new one
      if (isRegeneration) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
          if (lastAssistantIndex !== -1) {
            newMessages[lastAssistantIndex] = assistantMessage;
          } else {
            newMessages.push(assistantMessage);
          }
          return newMessages;
        });
      } else {
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Save AI response to database
      await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
        }]);

    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      
      // Remove temporary message if there was an error
      if (!isRegeneration) {
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content, true);
      }
    }
  };

  const handleRatingChange = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
  };

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleSpeechTranscription = (transcript: string) => {
    if (transcript.trim()) {
      setInput(transcript);
      toast({
        title: "Speech recognized",
        description: "You can edit the text before sending",
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-ai-light-blue to-ai-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
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
              <Button variant="ghost" size="icon" onClick={startNewChat}>
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
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
                    className="p-4 h-auto text-left bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
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
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`group flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-ai-blue dark:bg-blue-600 text-gray-900 dark:text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    } shadow-sm`}
                  >
                    {message.content}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="mt-2">
                      <MessageActions
                        messageId={message.id}
                        content={message.content}
                        role={message.role}
                        rating={message.rating}
                        onRegenerate={handleRegenerate}
                        onRatingChange={(rating) => handleRatingChange(message.id, rating)}
                      />
                    </div>
                  )}
                </div>

                {message.role === 'user' && user && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                  <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Copilot"
                className="pr-20 py-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={isLoading}
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <SpeechToText 
                  onTranscription={handleSpeechTranscription}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 w-12"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
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