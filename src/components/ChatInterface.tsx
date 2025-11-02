import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
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
import { useTheme } from '@/components/ThemeProvider';
import { 
  Menu, 
  Edit3, 
  Send, 
  Paperclip,
  Compass,
  Sparkles,
  Lightbulb,
  Code,
  Wand2,
  Plus,
  Moon,
  Sun
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
  conversationId?: string | null;
  onConversationChange?: (id: string | null) => void;
}

const STARTER_PROMPTS = [
  { icon: Lightbulb, text: "Explain quantum computing like I'm 5", category: "Learn" },
  { icon: Code, text: "Write a Python script to analyze CSV data", category: "Code" },
  { icon: Wand2, text: "Help me brainstorm creative project ideas", category: "Create" },
  { icon: Sparkles, text: "Suggest ways to improve my productivity", category: "Advice" }
];

export const ChatInterface = ({ onOpenSidebar, conversationId, onConversationChange }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createRipple = useRipple();
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showLongPress, setShowLongPress] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isStoppable, setIsStoppable] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      userScrolledRef.current = false;
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    if ((isTyping || isLoading) && !userScrolledRef.current) {
      scrollToBottom();
    }
  }, [messages, isTyping, isLoading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 50;
      
      // Show button only when user has scrolled away from bottom
      setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
      userScrolledRef.current = !isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        created_at: msg.created_at,
        rating: msg.rating || 0,
        metadata: msg.metadata
      })));
      
      setCurrentConversationId(id);
      onConversationChange?.(id);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateConversationTitle = async (firstMessage: string): Promise<string> => {
    try {
      const functionName = selectedModel === 'gemini' ? 'gemini-chat' : 'ai-chat';
      const modelParam = selectedModel === 'gemini' ? 'gemini-2.0-flash-exp' : 'google/gemini-2.5-flash';
      
      const { data } = await supabase.functions.invoke(functionName, {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Generate a short, creative 3-5 word title for a conversation that starts with: "${firstMessage.substring(0, 100)}". Reply with ONLY the title, no quotes or extra text.` 
          }],
          model: modelParam
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

  const processAttachedFiles = async (): Promise<string> => {
    if (attachedFiles.length === 0) return '';

    let fileContext = '\n\n[Attached Files]:\n';
    
    for (const file of attachedFiles) {
      fileContext += `\nFile: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})\n`;
      
      if (file.type.startsWith('text/') || file.type.includes('json')) {
        const text = await file.text();
        fileContext += `Content:\n${text}\n`;
      } else if (file.type === 'application/pdf' || file.type.includes('document')) {
        fileContext += `[Document file - content extraction would require backend processing]\n`;
      } else if (file.type.startsWith('image/')) {
        fileContext += `[Image file - visual analysis would require vision model]\n`;
      }
    }
    
    return fileContext;
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setIsTyping(false);
    setIsStoppable(false);
  };

  const sendMessage = async (messageText: string, isRegeneration = false) => {
    if (!messageText.trim() && !isRegeneration && attachedFiles.length === 0) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check for "Imagine" keyword
    const imagineMatch = messageText.match(/^imagine\s+(.+)/i);
    
    const fileContext = await processAttachedFiles();
    const fullMessage = messageText + fileContext;
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsStoppable(true);
    setAttachedFiles([]);

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
          content: fullMessage,
          created_at: new Date().toISOString(),
          rating: 0,
          metadata: attachedFiles.length > 0 ? { files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        await supabase.from('messages').insert([{
          conversation_id: conversationId,
          role: 'user',
          content: fullMessage,
          metadata: userMessage.metadata
        }]);
      }

      let aiResponse: string;

      if (imagineMatch) {
        setIsStoppable(false);
        aiResponse = await handleImageGeneration(imagineMatch[1]);
      } else {
        const messagesToSend = isRegeneration 
          ? messages
          : [...messages, ...(userMessage ? [userMessage] : [])];

        setIsLoading(true);

        // Determine which edge function to use based on selected model
        const functionName = selectedModel === 'gemini' ? 'gemini-chat' : 'ai-chat';
        const modelParam = selectedModel === 'gemini' ? 'gemini-2.0-flash-exp' : 'google/gemini-2.5-flash';

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { 
            messages: messagesToSend.map(m => ({ role: m.role, content: m.content })),
            conversationId,
            model: modelParam
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
      setIsStoppable(false);
      setAbortController(null);
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

  const handleSelectText = () => {
    const message = messages.find(m => m.id === selectedMessageId);
    if (message) {
      navigate('/text-selection', { 
        state: { 
          content: message.content, 
          conversationId: currentConversationId 
        } 
      });
    }
  };

  const handleShare = async () => {
    const message = messages.find(m => m.id === selectedMessageId);
    if (message && navigator.share) {
      try {
        await navigator.share({ text: message.content });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="hover:bg-accent">
            <Menu className="h-5 w-5" />
          </Button>
          <button 
            onClick={() => { 
              setMessages([]); 
              setCurrentConversationId(null); 
              onConversationChange?.(null);
            }}
            className="text-lg font-semibold hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
          >
            {messages.length > 0 ? 'SanGPT' : 'SanGPT'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-accent"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate('/explore')} className="hover:bg-accent">
                <Compass className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { 
                setMessages([]); 
                setCurrentConversationId(null); 
                onConversationChange?.(null);
              }} className="hover:bg-accent">
                <Edit3 className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8 bg-primary cursor-pointer ml-1" onClick={() => navigate('/account')}>
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user.user_metadata?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button onClick={() => setShowAuthModal(true)} className="rounded-full px-6 ml-2">
              Sign up
            </Button>
          )}
        </div>
      </header>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8 py-20">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  SanGPT
                </h1>
                <p className="text-lg text-muted-foreground">
                  {user ? `Hello, ${user.user_metadata?.display_name || user.email?.split('@')[0]}` : "How can I help you today?"}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {STARTER_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={i}
                      onClick={(e) => { createRipple(e); setInput(prompt.text); }}
                      className="p-4 rounded-xl border border-border hover:bg-accent transition-all flex flex-col items-start gap-2 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{prompt.category}</span>
                      </div>
                      <p className="text-sm text-foreground">{prompt.text}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message, idx) => (
              <div key={message.id} className="animate-fade-in">
                {message.role === 'user' ? (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl max-w-[80%] shadow-sm">
                      <p className="whitespace-pre-wrap break-words">{message.content.split('[Attached Files]')[0]}</p>
                      {message.metadata?.files && (
                        <div className="mt-2 space-y-2">
                          {message.metadata.files.map((file: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-background/10 px-3 py-2 rounded-lg text-sm">
                              <Paperclip className="h-4 w-4" />
                              <span className="flex-1 truncate">{file.name}</span>
                              <span className="text-xs">{(file.size / 1024).toFixed(1)}KB</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 bg-primary flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">S</AvatarFallback>
                    </Avatar>
                    <div 
                      className="flex-1 space-y-3"
                      onContextMenu={(e) => { e.preventDefault(); handleLongPress(message.id); }}
                      onTouchStart={(e) => {
                        const startY = e.touches[0].clientY;
                        const timer = setTimeout(() => {
                          const endY = e.touches[0]?.clientY;
                          if (Math.abs(endY - startY) < 10) {
                            handleLongPress(message.id);
                          }
                        }, 1900);
                        e.currentTarget.dataset.timer = String(timer);
                        e.currentTarget.dataset.startY = String(startY);
                      }}
                      onTouchMove={(e) => {
                        const timer = e.currentTarget.dataset.timer;
                        const startY = Number(e.currentTarget.dataset.startY);
                        const currentY = e.touches[0].clientY;
                        if (timer && Math.abs(currentY - startY) > 10) {
                          clearTimeout(Number(timer));
                        }
                      }}
                      onTouchEnd={(e) => {
                        const timer = e.currentTarget.dataset.timer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                     >
                       <MarkdownRenderer content={message.content} />
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
                )}
              </div>
            ))}
            
            {isLoading && isStoppable && (
              <div className="flex items-start gap-3 animate-fade-in">
                <Avatar className="h-7 w-7 bg-primary animate-pulse mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">S</AvatarFallback>
                </Avatar>
                <div className="flex-1 py-2">
                  <ShimmerLoading />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {showScrollButton && (
          <Button
            onClick={() => scrollToBottom()}
            className="fixed bottom-24 right-6 rounded-full shadow-lg z-50 h-12 w-12 bg-background border-2 border-primary hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 animate-fade-in"
            size="icon"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Button>
        )}
      </div>

      <div className="p-3 border-t backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          {isRecording && (
            <div className="mb-3 flex items-center justify-center">
              <WaveformAnimation />
            </div>
          )}
          
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-accent px-3 py-1.5 rounded-lg text-sm">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 object-cover rounded" />
                  ) : (
                    <Paperclip className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[120px] text-xs">{file.name}</span>
                  <button
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-destructive hover:text-destructive/80 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full flex-shrink-0" 
              onClick={(e) => { 
                createRipple(e); 
                setShowAttachment(true); 
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message SanGPT"
                className="w-full py-3 px-4 pr-20 rounded-3xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[52px] max-h-[200px] overflow-y-auto transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={1}
                style={{
                  height: 'auto',
                  maxHeight: '200px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  const newHeight = Math.min(target.scrollHeight, 200);
                  target.style.height = newHeight + 'px';
                }}
                disabled={isLoading || isRecording}
              />
              <div className="absolute right-2 bottom-2 flex gap-1 items-center">
                <SpeechToText 
                  onTranscription={(t) => { setInput(t); setIsRecording(false); }} 
                  disabled={isLoading} 
                  onRecordingChange={setIsRecording}
                />
                <Button 
                  onClick={(e) => { 
                    createRipple(e); 
                    if (isLoading && isStoppable) {
                      stopGeneration();
                    } else {
                      sendMessage(input);
                    }
                  }} 
                  disabled={!input.trim() && !isLoading} 
                  size="icon" 
                  className={`h-8 w-8 rounded-full ${
                    isLoading && isStoppable 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : 'bg-foreground hover:bg-foreground/90'
                  } text-background transition-all`}
                >
                  {isLoading && isStoppable ? (
                    <div className="h-2.5 w-2.5 bg-background rounded-sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <button 
              onClick={(e) => { createRipple(e); setShowModelSelector(true); }} 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Powered by Gemini
            </button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ModelSelectorModal isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      <LongPressModal 
        isOpen={showLongPress} 
        onClose={() => setShowLongPress(false)} 
        onCopy={() => { 
          const m = messages.find(msg => msg.id === selectedMessageId); 
          if(m) {
            navigator.clipboard.writeText(m.content);
            toast({ title: "Copied", description: "Message copied to clipboard" });
          }
          setShowLongPress(false);
        }} 
        onSelectText={() => {
          handleSelectText();
          setShowLongPress(false);
        }}
        onReadAloud={() => {
          toast({ title: "Read Aloud", description: "Text-to-speech feature coming soon" });
          setShowLongPress(false);
        }} 
        onRegenerate={() => {
          handleRegenerate();
          setShowLongPress(false);
        }}
        onShare={() => {
          handleShare();
          setShowLongPress(false);
        }}
        conversationId={currentConversationId}
      />
      <AttachmentModal 
        isOpen={showAttachment} 
        onClose={() => setShowAttachment(false)} 
        onFileSelect={(files) => {
          setAttachedFiles(prev => [...prev, ...files]);
          toast({ title: "Files attached", description: `${files.length} file(s) ready to send` });
        }} 
      />
    </div>
  );
};
