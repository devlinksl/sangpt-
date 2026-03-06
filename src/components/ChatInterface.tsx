import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { MessageActions } from '@/components/MessageActions';
import { StreamingMarkdown } from '@/components/StreamingMarkdown';
import { HomeScreen } from '@/components/HomeScreen';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ModelSelectorModal } from '@/components/ModelSelectorModal';
import { ChatInputBar } from '@/components/ChatInputBar';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { useStreamChat } from '@/hooks/useStreamChat';
import { getCachedMessages, cacheMessages, removeCachedConversation } from '@/lib/chatCache';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  Menu,
  Edit3,
  Paperclip,
  ArrowDown,
  MoreVertical,
  Share2,
  Pencil,
  Archive,
  Pin,
  Trash2,
  Flag,
  Copy,
  X,
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
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { streamChat, stopStreaming, isStreaming } = useStreamChat();
  const { preferences } = useUserPreferences();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState('lovable');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isStoppable, setIsStoppable] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Auto-scroll: scroll to bottom during streaming
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      userScrolledRef.current = false;
      setShowScrollButton(false);
    }
  }, []);

  // Auto-scroll on new content during streaming
  useEffect(() => {
    if (!userScrolledRef.current) scrollToBottom();
  }, [messages, isTyping, isLoading, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 100 && scrollHeight > clientHeight);
      userScrolledRef.current = distanceFromBottom > 100;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Load conversation — instant from cache, background sync
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      // Instant load from cache
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
      }
      setCurrentConversationId(id);
      onConversationChange?.(id);

      // Background sync from server
      const [{ data: msgData }, { data: convData }] = await Promise.all([
        supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
        supabase.from('conversations').select('title').eq('id', id).single(),
      ]);

      if (convData) setChatTitle(convData.title);

      if (msgData) {
        const serverMessages = msgData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.created_at,
          rating: msg.rating || 0,
          metadata: msg.metadata,
        }));
        setMessages(serverMessages);
        cacheMessages(msgData.map(msg => ({
          id: msg.id, conversation_id: msg.conversation_id, role: msg.role,
          content: msg.content, created_at: msg.created_at, rating: msg.rating || 0, metadata: msg.metadata,
        }))).catch(() => {});
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const generateConversationTitle = async (firstMessage: string): Promise<string> => {
    try {
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [{
            role: 'user',
            content: `Generate a short, creative 3-5 word title for a conversation that starts with: "${firstMessage.substring(0, 100)}". Reply with ONLY the title, no quotes or extra text.`
          }],
          model: 'google/gemini-2.5-flash'
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
      setChatTitle(title);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const processAttachedFiles = async (): Promise<{ text: string; imageDataUrls: string[] }> => {
    if (attachedFiles.length === 0) return { text: '', imageDataUrls: [] };
    let fileContext = '\n\n[Attached Files]:\n';
    const imageDataUrls: string[] = [];

    for (const file of attachedFiles) {
      fileContext += `\nFile: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})\n`;
      if (file.type.startsWith('text/') || file.type.includes('json')) {
        const text = await file.text();
        fileContext += `Content:\n${text}\n`;
      } else if (file.type === 'application/pdf' || file.type.includes('document')) {
        fileContext += `[Document file attached]\n`;
      } else if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageDataUrls.push(base64);
        fileContext += `[Image attached for analysis]\n`;
      }
    }
    return { text: fileContext, imageDataUrls };
  };

  const stopGeneration = () => {
    stopStreaming();
    setIsLoading(false);
    setIsTyping(false);
    setIsStoppable(false);
    setStreamingMessageId(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setChatTitle('');
    onConversationChange?.(null);
  };

  const sendMessage = useCallback(async (messageText: string, isRegeneration = false) => {
    if (!messageText.trim() && !isRegeneration && attachedFiles.length === 0) return;
    if (!user) { setShowAuthModal(true); return; }

    const imagineMatch = messageText.match(/^imagine\s+(.+)/i);
    const { text: fileContext, imageDataUrls } = await processAttachedFiles();
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
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewConversation(messageText);
        if (!convId) throw new Error('Failed to create conversation');
        setCurrentConversationId(convId);
        onConversationChange?.(convId);
      }

      if (!isRegeneration && userMessage) {
        supabase.from('messages').insert([{
          conversation_id: convId,
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
        try {
          const response = await fetch(`https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(imagineMatch[1])}`);
          const data = await response.json();
          aiResponse = data.status && data.result?.images?.[0]
            ? `![Generated Image](${data.result.images[0]})`
            : "Sorry, I couldn't generate that image.";
        } catch {
          aiResponse = "Sorry, image generation failed.";
        }
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

        const formattedMessages = messagesToSend.map(m => {
          if (m.id === userMessage?.id && imageDataUrls.length > 0) {
            const content: any[] = [{ type: 'text', text: m.content }];
            for (const dataUrl of imageDataUrls) {
              content.push({ type: 'image_url', image_url: { url: dataUrl } });
            }
            return { role: m.role, content };
          }
          return { role: m.role, content: m.content };
        });

        aiResponse = await streamChat(
          formattedMessages,
          convId,
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
              setMessages(prev => prev.filter(m => m.id !== streamMsgId));
            }
          },
          { customInstructions: preferences.custom_instructions }
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
          conversation_id: convId,
          role: 'assistant',
          content: aiResponse,
        }]);
      }
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      if (!isRegeneration) {
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsStoppable(false);
      setStreamingMessageId(null);
    }
  }, [user, currentConversationId, messages, attachedFiles, selectedModel, streamChat, preferences.custom_instructions]);

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) sendMessage(lastUserMessage.content, true);
  };

  // ─── 3-dot menu actions ───
  const handleRename = () => {
    setShowOverflowMenu(false);
    setRenameValue(chatTitle);
    setShowRenameModal(true);
  };

  const submitRename = async () => {
    if (!renameValue.trim() || !currentConversationId) return;
    setChatTitle(renameValue.trim());
    setShowRenameModal(false);
    await supabase.from('conversations').update({ title: renameValue.trim() }).eq('id', currentConversationId);
  };

  const handleDeleteChat = () => {
    setShowOverflowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteChat = async () => {
    if (!currentConversationId) return;
    const id = currentConversationId;
    setShowDeleteConfirm(false);
    handleNewChat();
    removeCachedConversation(id).catch(() => {});
    await supabase.from('conversations').delete().eq('id', id);
  };

  const handleShareChat = async () => {
    setShowOverflowMenu(false);
    if (navigator.share) {
      try {
        await navigator.share({ title: chatTitle, text: messages.map(m => `${m.role}: ${m.content}`).join('\n\n') });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(messages.map(m => `${m.role}: ${m.content}`).join('\n\n'));
    }
  };

  const handleCopyConversation = async () => {
    setShowOverflowMenu(false);
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'SanGPT'}: ${m.content}`).join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const handleArchiveChat = async () => {
    setShowOverflowMenu(false);
    // Archive = soft delete for now (remove from view)
    if (!currentConversationId) return;
    handleNewChat();
  };

  const handleReport = () => {
    setShowOverflowMenu(false);
    // Could open a report form
  };

  const overflowMenuItems = [
    { icon: Pencil, label: 'Rename', action: handleRename },
    { icon: Share2, label: 'Share', action: handleShareChat },
    { icon: Copy, label: 'Copy Conversation', action: handleCopyConversation },
    { icon: Archive, label: 'Archive', action: handleArchiveChat },
    { icon: Pin, label: 'Pin Chat', action: () => setShowOverflowMenu(false) },
    { icon: Trash2, label: 'Delete', action: handleDeleteChat, destructive: true },
    { icon: Flag, label: 'Report', action: handleReport },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-2 py-2 bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="h-10 w-10 rounded-full bg-accent/60 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/60 hover:bg-accent transition-colors max-w-[45%]">
          <span className="text-sm font-semibold truncate">
            {currentConversationId ? (chatTitle || 'SanGPT') : 'SanGPT'}
          </span>
        </button>

        <div className="flex items-center gap-0.5">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-10 w-10 rounded-full hover:bg-accent"
              >
                <Edit3 className="h-[18px] w-[18px]" />
              </Button>
              {currentConversationId && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                    className="h-10 w-10 rounded-full hover:bg-accent"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </Button>

                  {showOverflowMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowOverflowMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 w-52 bg-background/95 backdrop-blur-2xl rounded-xl border border-border/30 shadow-2xl z-50 overflow-hidden animate-scale-in">
                        {overflowMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors ${
                              item.destructive ? 'text-destructive' : 'text-foreground'
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="hover:bg-accent text-sm font-medium rounded-full px-4"
            >
              Sign in
            </Button>
          )}
        </div>
      </header>

      {/* ─── Messages ─── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
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
                    <div className="flex-1 space-y-2 prose-ai">
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
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = type === 'file' ? '.pdf,.doc,.docx,.txt' : 'image/*';
            if (type === 'camera') inp.capture = 'environment';
            inp.multiple = true;
            inp.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) setAttachedFiles(prev => [...prev, ...files]);
            };
            inp.click();
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

      {/* ─── Rename Modal ─── */}
      {showRenameModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRenameModal(false)}>
          <div className="bg-background rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-border/30 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Rename Chat</h3>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); }}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRenameModal(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={submitRename} className="flex-1 rounded-xl">Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-background rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-border/30 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete this chat?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteChat} className="flex-1 rounded-xl">Delete</Button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ModelSelectorModal isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
    </div>
  );
};
