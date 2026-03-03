import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { StreamingMarkdown } from '@/components/StreamingMarkdown';
import { HomeScreen } from '@/components/HomeScreen';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ModelSelectorModal } from '@/components/ModelSelectorModal';
import { AttachmentModal } from '@/components/AttachmentModal';
import { ChatInputBar } from '@/components/ChatInputBar';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useAlert } from '@/hooks/useAlert';
import { useNavigate } from 'react-router-dom';
import { useRipple } from '@/hooks/useRipple';
import { useTheme } from '@/components/ThemeProvider';
import { humanizeError } from '@/lib/humanizeError';
import { useStreamChat } from '@/hooks/useStreamChat';
import { getCachedMessages, cacheMessages } from '@/lib/chatCache';
import {
  Menu,
  Edit3,
  Paperclip,
  ArrowDown
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

export const ChatInterface = ({ onOpenSidebar, conversationId, onConversationChange }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { alert } = useAlert();
  const navigate = useNavigate();
  const createRipple = useRipple();
  const { theme, setTheme } = useTheme();
  const { streamChat, stopStreaming, isStreaming } = useStreamChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [selectedModel, setSelectedModel] = useState('lovable');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isStoppable, setIsStoppable] = useState(false);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
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
      // 1. Load from cache instantly
      const cached = await getCachedMessages(id);
      if (cached.length > 0) {
        setMessages(cached.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.created_at,
          rating: msg.rating || 0,
          metadata: msg.metadata,
        })));
        setCurrentConversationId(id);
        onConversationChange?.(id);
      }

      // 2. Fetch from server
      setIsLoading(cached.length === 0);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const serverMessages = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        created_at: msg.created_at,
        rating: msg.rating || 0,
        metadata: msg.metadata,
      }));

      setMessages(serverMessages);
      setCurrentConversationId(id);
      onConversationChange?.(id);

      // Cache for offline
      cacheMessages(data.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        rating: msg.rating || 0,
        metadata: msg.metadata,
      }))).catch(() => {});
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert({
        title: "Error",
        description: humanizeError(error) ?? "Failed to load conversation",
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
    stopStreaming();
    setIsLoading(false);
    setIsTyping(false);
    setIsStoppable(false);
    setStreamingMessageId(null);
  };

  const sendMessage = useCallback(async (messageText: string, isRegeneration = false) => {
    if (!messageText.trim() && !isRegeneration && attachedFiles.length === 0) return;
    if (!user) { setShowAuthModal(true); return; }

    const imagineMatch = messageText.match(/^imagine\s+(.+)/i);
    const fileContext = await processAttachedFiles();
    const fullMessage = messageText + fileContext;
    setAttachedFiles([]);

    let userMessage: Message | null = null;
    if (!isRegeneration) {
      userMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: fullMessage,
        created_at: new Date().toISOString(),
        rating: 0,
        metadata: attachedFiles.length > 0 ? { files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined,
      };
      setMessages(prev => [...prev, userMessage!]);
      setInput('');
    }

    setIsStoppable(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation(messageText);
        if (!conversationId) throw new Error('Failed to create conversation');
        setCurrentConversationId(conversationId);
      }

      if (!isRegeneration && userMessage) {
        supabase.from('messages').insert([{
          conversation_id: conversationId,
          role: 'user',
          content: fullMessage,
          metadata: userMessage.metadata,
        }]).then(({ error }) => {
          if (error) console.error('Error saving user message:', error);
        });
      }

      let aiResponse: string;

      if (imagineMatch) {
        setIsStoppable(false);
        setIsLoading(true);
        aiResponse = await handleImageGeneration(imagineMatch[1]);
        setIsLoading(false);
      } else {
        const messagesToSend = isRegeneration
          ? messages
          : [...messages, ...(userMessage ? [userMessage] : [])];

        setIsLoading(true);
        setIsTyping(true);

        const streamMsgId = `ai-streaming-${Date.now()}`;
        setStreamingMessageId(streamMsgId);

        const streamingMessage: Message = {
          id: streamMsgId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          rating: 0,
        };

        setMessages(prev => {
          if (isRegeneration) {
            const newMessages = [...prev];
            const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
            if (lastAssistantIndex !== -1) newMessages[lastAssistantIndex] = streamingMessage;
            else newMessages.push(streamingMessage);
            return newMessages;
          }
          return [...prev, streamingMessage];
        });

        const modelParam = selectedModel === 'gemini' ? 'google/gemini-2.5-flash' : 'google/gemini-3-flash-preview';

        aiResponse = await streamChat(
          messagesToSend.map(m => ({ role: m.role, content: m.content })),
          conversationId,
          modelParam,
          {
            onToken: (token) => {
              setMessages(prev => prev.map(m =>
                m.id === streamMsgId ? { ...m, content: m.content + token } : m
              ));
            },
            onComplete: (fullResponse) => {
              const finalMsgId = `ai-${Date.now()}`;
              setMessages(prev => prev.map(m =>
                m.id === streamMsgId ? { ...m, id: finalMsgId, content: fullResponse } : m
              ));
              setStreamingMessageId(null);
            },
            onError: (error) => {
              console.error('Stream error:', error);
              alert({
                title: "Error",
                description: humanizeError(error) ?? error?.message ?? "Failed to get response",
                variant: "destructive",
              });
              setMessages(prev => prev.filter(m => m.id !== streamMsgId));
            }
          }
        );

        if (!aiResponse) throw new Error('No response from AI');
        setIsTyping(false);
        setIsLoading(false);
      }

      // Save AI response
      if (aiResponse) {
        if (imagineMatch) {
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
              if (lastAssistantIndex !== -1) newMessages[lastAssistantIndex] = assistantMessage;
              else newMessages.push(assistantMessage);
              return newMessages;
            }
            return [...prev, assistantMessage];
          });
        }

        await supabase.from('messages').insert([{
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
        }]);
      }
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      alert({
        title: "Error",
        description: humanizeError(error) ?? error?.message ?? "Failed to send message",
        variant: "destructive",
      });
      if (!isRegeneration) {
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsStoppable(false);
      setStreamingMessageId(null);
    }
  }, [user, currentConversationId, messages, attachedFiles, selectedModel, streamChat]);

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) sendMessage(lastUserMessage.content, true);
  };

  const chatTitle = currentConversationId ? 'SanGPT' : 'SanGPT';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ─── Clean Header ─── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/60 backdrop-blur-2xl backdrop-saturate-150 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="hover:bg-accent">
          <Menu className="h-5 w-5" />
        </Button>

        <span className="text-base font-semibold">{chatTitle}</span>

        {user ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setNewChatLoading(true);
              setMessages([]);
              setCurrentConversationId(null);
              onConversationChange?.(null);
              setTimeout(() => setNewChatLoading(false), 3000);
            }}
            className="hover:bg-accent"
          >
            <Edit3 className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAuthModal(true)}
            className="hover:bg-accent text-sm font-medium"
          >
            Sign in
          </Button>
        )}
      </header>

      {/* ─── Messages ─── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {newChatLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Starting new chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <HomeScreen
            onPromptSelect={(text) => setInput(text)}
            onConversationSelect={(id) => loadConversation(id)}
            user={user}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                {message.role === 'user' ? (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-3 rounded-2xl max-w-[80%] shadow-md">
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
                    <div className="flex-1 space-y-2">
                      <StreamingMarkdown
                        content={message.content}
                        isStreaming={streamingMessageId === message.id}
                      />
                      {streamingMessageId !== message.id && (
                        <MessageActions
                          messageId={message.id}
                          content={message.content}
                          role={message.role}
                          rating={message.rating}
                          onRegenerate={handleRegenerate}
                          onRatingChange={(r) => setMessages(p => p.map(m => m.id === message.id ? { ...m, rating: r } : m))}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && !streamingMessageId && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {showScrollButton && (
          <Button
            onClick={() => scrollToBottom()}
            className="fixed bottom-24 right-6 rounded-full shadow-xl z-50 h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 transition-all duration-300 animate-fade-in border-0"
            size="icon"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* ─── Input ─── */}
      <div className="sticky bottom-0 pb-4 pt-2 bg-gradient-to-t from-background/90 via-background/70 to-transparent backdrop-blur-xl">
        {isRecording && (
          <div className="mb-3 flex items-center justify-center">
            <WaveformAnimation />
          </div>
        )}

        {attachedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto px-3 mb-2">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-accent/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm border border-border/50">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 object-cover rounded" />
                  ) : (
                    <Paperclip className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[120px] text-xs">{file.name}</span>
                  <button
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-destructive hover:text-destructive/80 text-xs font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          onAttachment={(type) => {
            if (type === 'image' || type === 'camera') {
              const inp = document.createElement('input');
              inp.type = 'file';
              inp.accept = 'image/*';
              if (type === 'camera') inp.capture = 'environment';
              inp.multiple = true;
              inp.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                if (files.length > 0) {
                  setAttachedFiles(prev => [...prev, ...files]);
                  alert({ title: "Files Attached", description: `${files.length} file(s) ready to send`, variant: "success" });
                }
              };
              inp.click();
            } else {
              const inp = document.createElement('input');
              inp.type = 'file';
              inp.accept = '.pdf,.doc,.docx,.txt';
              inp.multiple = true;
              inp.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                if (files.length > 0) {
                  setAttachedFiles(prev => [...prev, ...files]);
                  alert({ title: "Files Attached", description: `${files.length} file(s) ready to send`, variant: "success" });
                }
              };
              inp.click();
            }
          }}
          onModelSelect={() => setShowModelSelector(true)}
          onRecordingChange={setIsRecording}
          onTranscription={(text) => setInput(text)}
          isLoading={isLoading}
          isRecording={isRecording}
          isStoppable={isStoppable}
          onStop={stopGeneration}
          disabled={!user}
        />
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ModelSelectorModal isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      <AttachmentModal
        isOpen={showAttachment}
        onClose={() => setShowAttachment(false)}
        onFileSelect={(files) => {
          setAttachedFiles(prev => [...prev, ...files]);
          alert({ title: "Files Attached", description: `${files.length} file(s) ready to send`, variant: "success" });
        }}
      />
    </div>
  );
};
