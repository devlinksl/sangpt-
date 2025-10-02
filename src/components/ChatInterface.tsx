import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { MessageFormatter } from '@/components/MessageFormatter';
import { ShimmerLoading } from '@/components/ShimmerLoading';
import { SpeechToText } from '@/components/SpeechToText';
import { ModelSelectorModal } from '@/components/ModelSelectorModal';
import { LongPressModal } from '@/components/LongPressModal';
import { AttachmentModal } from '@/components/AttachmentModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useRipple } from '@/hooks/useRipple';
import { 
  Menu, 
  Edit3, 
  Send, 
  Paperclip,
  Loader2,
  Settings,
  Compass,
  Sparkles,
  Plus
} from 'lucide-react';

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
  "Help me write something",
  "Brainstorm ideas", 
  "Learn something new",
  "Get advice"
];

export const ChatInterface = ({ onOpenSidebar }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createRipple = useRipple();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showLongPress, setShowLongPress] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-exp');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
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

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (!conversationId) throw new Error('Failed to create conversation');
        setCurrentConversationId(conversationId);
      }

      let userMessage: Message | null = null;

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

        await supabase.from('messages').insert([{
          conversation_id: conversationId,
          role: 'user',
          content: messageText,
        }]);
      }

      const messagesToSend = isRegeneration 
        ? messages.filter(m => m.role === 'user')
        : [...messages.filter(m => m.role === 'user'), ...(userMessage ? [userMessage] : [])];

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          messages: messagesToSend.map(m => ({ role: m.role, content: m.content })),
          conversationId,
          model: selectedModel
        }
      });

      if (error || data.error) throw new Error(data?.error || error?.message || 'Failed to get AI response');

      const aiResponse = data.response;
      if (!aiResponse) throw new Error('No response from AI');

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString(),
        rating: 0,
      };

      setMessages(prev => {
        if (isRegeneration) {
          const newMessages = [...prev];
          const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
          if (lastAssistantIndex !== -1) {
            newMessages[lastAssistantIndex] = assistantMessage;
          } else {
            newMessages.push(assistantMessage);
          }
          return newMessages;
        }
        return [...prev, assistantMessage];
      });

      await supabase.from('messages').insert([{
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
      
      if (!isRegeneration) {
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) sendMessage(lastUserMessage.content, true);
  };

  const handleLongPress = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowLongPress(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-ai-light-blue to-ai-white dark:from-gray-900 dark:to-gray-800">
      <header className="flex items-center justify-between p-4 border-b border-border/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <button 
            onClick={() => setShowModelSelector(true)}
            className="text-lg font-semibold hover:bg-muted px-3 py-1 rounded-lg transition-colors"
          >
            {messages.length > 0 ? 'New conversation' : 'Copilot'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
                <Compass className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setMessages([]); setCurrentConversationId(null); }}>
                <Edit3 className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple cursor-pointer" onClick={() => navigate('/settings')}>
                <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-medium">
                  {user.user_metadata?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'W'}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button onClick={() => setShowAuthModal(true)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
              Sign up
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl font-bold">
                {user ? `Hi ${user.user_metadata?.display_name || user.email?.split('@')[0]}, what's new?` : "What can I help with?"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <Button key={i} variant="outline" onClick={() => setInput(prompt)} className="p-4 h-auto rounded-xl hover:scale-105 transition-all">
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`group flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white">AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div
                    onContextMenu={(e) => { if (message.role === 'assistant') { e.preventDefault(); handleLongPress(message.id); }}}
                    className={`p-4 rounded-2xl ${message.role === 'user' ? 'bg-ai-blue dark:bg-blue-600 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-800 border'} shadow-sm`}
                  >
                    {message.role === 'assistant' ? <MessageFormatter content={message.content} /> : message.content}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="mt-2">
                      <MessageActions messageId={message.id} content={message.content} role={message.role} rating={message.rating} onRegenerate={handleRegenerate} onRatingChange={(r) => setMessages(p => p.map(m => m.id === message.id ? {...m, rating: r} : m))} />
                    </div>
                  )}
                </div>

                {message.role === 'user' && user && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                    <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white">{user.user_metadata?.display_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                  <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white">AI</AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message Copilot" className="pr-20 py-3 rounded-2xl" onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))} disabled={isLoading} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAttachment(true)}><Paperclip className="h-4 w-4" /></Button>
                <SpeechToText onTranscription={(t) => setInput(t)} disabled={isLoading} />
              </div>
            </div>
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 w-12">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <button onClick={() => setShowModelSelector(true)} className="flex items-center gap-1 hover:text-foreground"><Plus className="h-4 w-4" />Quick response</button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ModelSelectorModal isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      <LongPressModal isOpen={showLongPress} onClose={() => setShowLongPress(false)} onCopy={() => { const m = messages.find(msg => msg.id === selectedMessageId); if(m) navigator.clipboard.writeText(m.content); }} onSelectText={() => {}} onReadAloud={() => {}} onRegenerate={handleRegenerate} />
      <AttachmentModal isOpen={showAttachment} onClose={() => setShowAttachment(false)} onFileSelect={(f) => toast({ title: "File attached", description: f.name })} />
    </div>
  );
};
