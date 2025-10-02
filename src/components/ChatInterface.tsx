import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { TypingText } from '@/components/TypingText';
import { ShimmerLoading } from '@/components/ShimmerLoading';
import { SpeechToText } from '@/components/SpeechToText';
import { WaveformAnimation } from '@/components/WaveformAnimation';
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
  Compass,
  Sparkles,
  Lightbulb,
  Code,
  Wand2
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

const STARTER_PROMPTS = [
  { icon: Lightbulb, text: "Explain quantum computing like I'm 5", category: "Learn" },
  { icon: Code, text: "Write a Python script to analyze CSV data", category: "Code" },
  { icon: Wand2, text: "Help me brainstorm creative project ideas", category: "Create" },
  { icon: Sparkles, text: "Suggest ways to improve my productivity", category: "Advice" }
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
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateConversationTitle = async (firstMessage: string): Promise<string> => {
    try {
      const { data } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Generate a short, creative 3-5 word title for a conversation that starts with: "${firstMessage.substring(0, 100)}". Reply with ONLY the title, no quotes or extra text.` 
          }],
          model: selectedModel
        }
      });
      return data?.response?.substring(0, 50) || 'New conversation';
    } catch {
      return 'New conversation';
    }
  };

  const createNewConversation = async (firstMessage?: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const title = firstMessage ? await generateConversationTitle(firstMessage) : 'New conversation';
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: user.id, title }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const handleImageGeneration = async (prompt: string) => {
    try {
      const response = await fetch(`https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`);
      const data = await response.json();
      
      if (data.status && data.result?.images?.[0]) {
        return `![Generated Image](${data.result.images[0]})`;
      }
      return "Sorry, I couldn't generate that image.";
    } catch (error) {
      console.error('Image generation error:', error);
      return "Sorry, image generation failed.";
    }
  };

  const sendMessage = async (messageText: string, isRegeneration = false) => {
    if (!messageText.trim() && !isRegeneration) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check for "Imagine" keyword
    const imagineMatch = messageText.match(/^imagine\s+(.+)/i);
    
    setIsLoading(true);
    setIsTyping(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation(messageText);
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

      let aiResponse: string;

      if (imagineMatch) {
        aiResponse = await handleImageGeneration(imagineMatch[1]);
      } else {
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
        aiResponse = data.response;
        if (!aiResponse) throw new Error('No response from AI');
      }

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
      setIsTyping(false);
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
            <div className="max-w-4xl mx-auto space-y-10 py-12">
              <div className="space-y-3">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-ai-blue to-ai-purple bg-clip-text text-transparent">
                  SanGPT
                </h1>
                <p className="text-xl text-muted-foreground">
                  {user ? `Hi ${user.user_metadata?.display_name || user.email?.split('@')[0]}, what's new?` : "How can I help you today?"}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {STARTER_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={(e) => { createRipple(e); setInput(prompt.text); }}
                      className="p-6 h-auto rounded-2xl hover:scale-105 transition-all flex flex-col items-start gap-3 text-left border-2 hover:border-primary relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-xs font-semibold text-primary">{prompt.category}</span>
                      </div>
                      <p className="text-sm font-medium">{prompt.text}</p>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {messages.map((message, idx) => (
              <div key={message.id} className="w-full animate-fade-in">
                {message.role === 'user' ? (
                  <div className="flex items-start gap-4 justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-primary/10 px-6 py-3 rounded-2xl max-w-[85%]">
                        <p className="text-foreground">{message.content}</p>
                      </div>
                    </div>
                    {user && (
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-semibold">
                          {user.user_metadata?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-bold">S</AvatarFallback>
                    </Avatar>
                    <div 
                      className="flex-1 py-2 select-none"
                      onContextMenu={(e) => { e.preventDefault(); handleLongPress(message.id); }}
                      onTouchStart={(e) => {
                        const timer = setTimeout(() => handleLongPress(message.id), 500);
                        e.currentTarget.dataset.timer = String(timer);
                      }}
                      onTouchEnd={(e) => {
                        const timer = e.currentTarget.dataset.timer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                    >
                      {idx === messages.length - 1 && isTyping ? (
                        <TypingText text={message.content} onComplete={() => setIsTyping(false)} speed={20} />
                      ) : (
                        <TypingText text={message.content} speed={0} />
                      )}
                      <div className="mt-3">
                        <MessageActions 
                          messageId={message.id} 
                          content={message.content} 
                          role={message.role} 
                          rating={message.rating} 
                          onRegenerate={handleRegenerate} 
                          onRatingChange={(r) => setMessages(p => p.map(m => m.id === message.id ? {...m, rating: r} : m))} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && !isTyping && (
              <div className="flex items-start gap-4 animate-fade-in">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-ai-blue to-ai-purple">
                  <AvatarFallback className="bg-gradient-to-br from-ai-blue to-ai-purple text-white font-bold">S</AvatarFallback>
                </Avatar>
                <div className="flex-1 py-2">
                  <ShimmerLoading />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {isRecording && (
            <div className="mb-4 flex items-center justify-center">
              <WaveformAnimation />
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Message SanGPT..." 
                className="pr-20 py-3 rounded-2xl" 
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))} 
                disabled={isLoading || isRecording} 
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { createRipple(e); setShowAttachment(true); }}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <SpeechToText 
                  onTranscription={(t) => { setInput(t); setIsRecording(false); }} 
                  disabled={isLoading} 
                  onRecordingChange={setIsRecording}
                />
              </div>
            </div>
            <Button 
              onClick={(e) => { createRipple(e); sendMessage(input); }} 
              disabled={!input.trim() || isLoading} 
              size="icon" 
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 w-12 relative overflow-hidden"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <button onClick={(e) => { createRipple(e); setShowModelSelector(true); }} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Sparkles className="h-3 w-3" />
              {selectedModel}
            </button>
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
