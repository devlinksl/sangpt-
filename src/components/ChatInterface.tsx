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
import { ChatInputBar, type ChatInputBarHandle } from '@/components/ChatInputBar';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { useStreamChat } from '@/hooks/useStreamChat';
import { getCachedMessages, cacheMessages, removeCachedConversation } from '@/lib/chatCache';
import { conversationsStore } from '@/hooks/useConversationsStore';
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
  WifiOff,
} from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');

  .san-root {
    font-family: 'Inter', sans-serif;
  }

  .san-header {
    background: hsl(var(--background) / 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid hsl(var(--border) / 0.2);
  }

  .san-logo-pill {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .san-logo-pill-wrapper {
    background: hsl(var(--primary) / 0.08);
    border: 1px solid hsl(var(--primary) / 0.2);
    border-radius: 999px;
    padding: 6px 16px;
    transition: all 0.2s ease;
  }

  .san-logo-pill-wrapper:hover {
    background: hsl(var(--primary) / 0.14);
    border-color: hsl(var(--primary) / 0.35);
  }

  /* User message bubble */
  .san-bubble-user {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
    color: hsl(var(--primary-foreground));
    border-radius: 18px 18px 4px 18px;
    padding: 12px 16px;
    max-width: 80%;
    box-shadow: 0 4px 20px hsl(var(--primary) / 0.25);
    position: relative;
    user-select: none;
    transition: box-shadow 0.2s ease;
  }

  .san-bubble-user:active {
    box-shadow: 0 2px 10px hsl(var(--primary) / 0.3);
  }

  /* AI message area */
  .san-ai-wrap {
    display: flex;
    align-items: flex-start;
  }

  /* Message stack spacing */
  .san-messages-stack > * + * {
    margin-top: 20px;
  }

  /* Scroll button */
  .san-scroll-btn {
    position: fixed;
    bottom: 96px;
    right: 20px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px hsl(var(--primary) / 0.4);
    cursor: pointer;
    z-index: 50;
    animation: san-bounce-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .san-scroll-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px hsl(var(--primary) / 0.5);
  }

  @keyframes san-bounce-in {
    from { opacity: 0; transform: scale(0.6) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Offline banner */
  .san-offline-banner {
    background: hsl(var(--destructive) / 0.1);
    border-bottom: 1px solid hsl(var(--destructive) / 0.25);
    color: hsl(var(--destructive));
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 16px;
    animation: san-slide-down 0.25s ease;
  }

  @keyframes san-slide-down {
    from { opacity: 0; transform: translateY(-100%); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Glassmorphism modal backdrop */
  .san-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .san-modal-sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .san-modal-card {
    background: hsl(var(--background) / 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid hsl(var(--border) / 0.35);
    border-radius: 20px;
    padding: 24px;
    margin: 16px;
    max-width: 360px;
    width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,0.25);
    animation: san-scale-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes san-scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }

  .san-modal-sheet {
    background: hsl(var(--background) / 0.95);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid hsl(var(--border) / 0.25);
    border-top-left-radius: 22px;
    border-top-right-radius: 22px;
    width: 100%;
    max-width: 480px;
    padding-bottom: env(safe-area-inset-bottom, 16px);
    box-shadow: 0 -12px 40px rgba(0,0,0,0.18);
    animation: san-slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes san-slide-up {
    from { opacity: 0; transform: translateY(60px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Overflow dropdown */
  .san-overflow-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    width: 210px;
    background: hsl(var(--background) / 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid hsl(var(--border) / 0.3);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    z-index: 50;
    overflow: hidden;
    animation: san-scale-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: top right;
  }

  /* Input area gradient */
  .san-input-area {
    background: linear-gradient(to top, hsl(var(--background)) 60%, hsl(var(--background) / 0));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* Offline empty state icon */
  .san-offline-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: hsl(var(--accent) / 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  /* Edited badge */
  .san-edited-badge {
    font-size: 10px;
    opacity: 0.65;
    margin-top: 4px;
    font-style: italic;
  }

  /* File chip */
  .san-file-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: hsl(var(--accent) / 0.8);
    backdrop-filter: blur(8px);
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 12px;
    border: 1px solid hsl(var(--border) / 0.5);
  }

  /* Message attachment in bubble */
  .san-bubble-attachment {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.12);
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    margin-top: 8px;
  }

  /* Smooth fade in for each message */
  .san-msg-appear {
    animation: san-fade-up 0.25s ease;
  }

  @keyframes san-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Icon button */
  .san-icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
    color: hsl(var(--foreground));
  }

  .san-icon-btn:hover {
    background: hsl(var(--accent) / 0.7);
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  rating: number;
  metadata?: any;
  edited_at?: string | null;
}

interface ChatInterfaceProps {
  onOpenSidebar: () => void;
  conversationId?: string | null;
  onConversationChange?: (id: string | null) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineUnavailable, setOfflineUnavailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<ChatInputBarHandle>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      userScrolledRef.current = false;
      setShowScrollButton(false);
    }
  }, []);

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

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      setOfflineUnavailable(false);
      const cached = await getCachedMessages(id);
      if (cached.length > 0) {
        setMessages(cached.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.created_at,
          rating: msg.rating || 0,
          metadata: msg.metadata,
          edited_at: (msg as any).edited_at ?? null,
        })));
      } else if (!navigator.onLine) {
        setMessages([]);
        setOfflineUnavailable(true);
      }
      setCurrentConversationId(id);
      onConversationChange?.(id);

      if (!navigator.onLine) return;

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
          edited_at: (msg as any).edited_at ?? null,
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
      const placeholder = firstMessage
        ? firstMessage.substring(0, 40).trim() || 'New conversation'
        : 'New conversation';
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: user.id, title: placeholder }])
        .select()
        .single();
      if (error) throw error;
      setChatTitle(placeholder);

      // Push to global store immediately so the sidebar reflects it everywhere
      conversationsStore.upsert(data as any);

      if (firstMessage) {
        generateConversationTitle(firstMessage).then(async (title) => {
          if (!title || title === placeholder) return;
          setChatTitle(title);
          conversationsStore.updateTitle(data.id, title);
          await supabase.from('conversations').update({ title }).eq('id', data.id);
        }).catch(() => {});
      }
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
    setIsLoading(true);
    setIsTyping(true);

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

  const openMessageMenu = (id: string) => setMessageMenuId(id);

  const handleCopyMessage = async () => {
    const msg = messages.find(m => m.id === messageMenuId);
    setMessageMenuId(null);
    if (msg) await navigator.clipboard.writeText(msg.content);
  };

  const handleDeleteMessage = async () => {
    const id = messageMenuId;
    setMessageMenuId(null);
    if (!id) return;
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleStartEdit = () => {
    const id = messageMenuId;
    setMessageMenuId(null);
    if (!id) return;
    const msg = messages.find(m => m.id === id);
    if (!msg || msg.role !== 'user') return;
    setEditingMessageId(id);
    setEditingDraft(msg.content.split('[Attached Files]')[0]);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingDraft('');
  };

  const submitEdit = async () => {
    const id = editingMessageId;
    const newContent = editingDraft.trim();
    if (!id || !newContent) { cancelEdit(); return; }

    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) { cancelEdit(); return; }

    const editedAt = new Date().toISOString();
    const truncated = messages.slice(0, idx + 1).map((m, i) =>
      i === idx ? { ...m, content: newContent, edited_at: editedAt } : m
    );
    setMessages(truncated);
    setEditingMessageId(null);
    setEditingDraft('');

    if (!id.startsWith('temp-') && currentConversationId) {
      supabase
        .from('messages')
        .update({ content: newContent, edited_at: editedAt } as any)
        .eq('id', id)
        .then(({ error }) => { if (error) console.error('Edit save failed:', error); });
    }

    sendMessage(newContent, true);
  };

  const handleRename = () => {
    setShowOverflowMenu(false);
    setRenameValue(chatTitle);
    setShowRenameModal(true);
  };

  const submitRename = async () => {
    if (!renameValue.trim() || !currentConversationId) return;
    const t = renameValue.trim();
    setChatTitle(t);
    setShowRenameModal(false);
    conversationsStore.updateTitle(currentConversationId, t);
    await supabase.from('conversations').update({ title: t }).eq('id', currentConversationId);
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
    conversationsStore.remove(id);
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
    if (!currentConversationId) return;
    handleNewChat();
  };

  const handleReport = () => {
    setShowOverflowMenu(false);
  };

  const overflowMenuItems = [
    { icon: Pencil,  label: 'Rename',            action: handleRename },
    { icon: Share2,  label: 'Share',              action: handleShareChat },
    { icon: Copy,    label: 'Copy Conversation',  action: handleCopyConversation },
    { icon: Archive, label: 'Archive',            action: handleArchiveChat },
    { icon: Pin,     label: 'Pin Chat',           action: () => setShowOverflowMenu(false) },
    { icon: Trash2,  label: 'Delete',             action: handleDeleteChat, destructive: true },
    { icon: Flag,    label: 'Report',             action: handleReport },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="san-root flex flex-col h-screen bg-background">

        {/* ─── Offline Banner ─── */}
        {!isOnline && (
          <div className="san-offline-banner">
            <WifiOff size={13} />
            <span>You're offline — messages may not be sent</span>
          </div>
        )}

        {/* ─── Header ─── */}
        <header className="san-header flex items-center justify-between px-3 py-2 sticky top-0 z-10">
          <button
            className="san-icon-btn"
            onClick={onOpenSidebar}
          >
            <Menu size={20} />
          </button>

          {/* Logo / Title pill */}
          <button
            onClick={() => { if (currentConversationId && chatTitle) setShowTitleModal(true); }}
            className="san-logo-pill-wrapper flex items-center gap-1.5 max-w-[45%]"
          >
            <span className="san-logo-pill text-sm truncate">
              {currentConversationId ? (chatTitle || 'SanGPT') : 'SanGPT'}
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            {user ? (
              <>
                <button className="san-icon-btn" onClick={handleNewChat}>
                  <Edit3 size={18} />
                </button>
                {currentConversationId && (
                  <div className="relative">
                    <button
                      className="san-icon-btn"
                      onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {showOverflowMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowOverflowMenu(false)} />
                        <div className="san-overflow-dropdown">
                          {overflowMenuItems.map((item) => (
                            <button
                              key={item.label}
                              onClick={item.action}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50 ${
                                item.destructive ? 'text-destructive' : 'text-foreground'
                              }`}
                            >
                              <item.icon size={15} />
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
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto relative overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {offlineUnavailable ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="san-offline-icon">
                <WifiOff size={26} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="text-base font-semibold">Chat not available offline</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                This conversation hasn't been cached on this device. Reconnect to load it.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <HomeScreen
              onPromptSelect={(text) => setInput(text)}
              onConversationSelect={(id) => loadConversation(id)}
              user={user}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 san-messages-stack">
              {messages.map((message) => (
                <div key={message.id} className="san-msg-appear">
                  {message.role === 'user' ? (
                    <UserBubble
                      message={message}
                      isEditing={editingMessageId === message.id}
                      editingDraft={editingDraft}
                      setEditingDraft={setEditingDraft}
                      onSubmitEdit={submitEdit}
                      onCancelEdit={cancelEdit}
                      onLongPress={() => openMessageMenu(message.id)}
                    />
                  ) : (
                    <div className="san-ai-wrap">
                      <div className="flex-1 space-y-2 prose-ai min-w-0">
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

          {/* Scroll-to-bottom button */}
          {showScrollButton && (
            <button className="san-scroll-btn" onClick={() => scrollToBottom()}>
              <ArrowDown size={18} />
            </button>
          )}
        </div>

        {/* ─── Input Area ─── */}
        <div className="san-input-area sticky bottom-0 pb-4 pt-2">
          {isRecording && (
            <div className="mb-3 flex items-center justify-center">
              <WaveformAnimation />
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="max-w-3xl mx-auto px-3 mb-2">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="san-file-chip">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 object-cover rounded" />
                    ) : (
                      <Paperclip size={12} />
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
            ref={inputBarRef}
            initialValue={input}
            onSend={(text) => { setInput(''); sendMessage(text); }}
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
            onTranscription={(text) => inputBarRef.current?.setText(text)}
            isLoading={isLoading}
            isRecording={isRecording}
            isStoppable={isStoppable}
            onStop={stopGeneration}
            disabled={!user}
          />
        </div>

        {/* ─── Rename Modal ─── */}
        {showRenameModal && (
          <div className="san-modal-backdrop" onClick={() => setShowRenameModal(false)}>
            <div className="san-modal-card" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Rename Chat</h3>
              <p className="text-xs text-muted-foreground mb-4">Give this conversation a new name.</p>
              <Input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitRename(); }}
                className="mb-4 rounded-xl"
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
          <div className="san-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
            <div className="san-modal-card" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'hsl(var(--destructive) / 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Trash2 size={18} style={{ color: 'hsl(var(--destructive))' }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'Sora, sans-serif' }}>Delete this chat?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button variant="destructive" onClick={confirmDeleteChat} className="flex-1 rounded-xl">Delete</Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Title Modal ─── */}
        {showTitleModal && (
          <div className="san-modal-backdrop" onClick={() => setShowTitleModal(false)}>
            <div className="san-modal-card" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Chat Title</p>
              <h3 className="text-lg font-semibold mb-6 break-words" style={{ fontFamily: 'Sora, sans-serif' }}>{chatTitle}</h3>
              <Button onClick={() => setShowTitleModal(false)} className="w-full rounded-xl">Close</Button>
            </div>
          </div>
        )}

        {/* ─── Message context menu (long press) ─── */}
        {messageMenuId && (
          <div className="san-modal-sheet-backdrop" onClick={() => setMessageMenuId(null)}>
            <div className="san-modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-10 h-1 rounded-full bg-muted my-3" />
              <div className="px-2 pb-2">
                {[
                  { icon: Pencil, label: 'Edit',   action: handleStartEdit,   destructive: false },
                  { icon: Copy,   label: 'Copy',   action: handleCopyMessage, destructive: false },
                  { icon: Trash2, label: 'Delete', action: handleDeleteMessage, destructive: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/50 transition-colors text-left ${
                      item.destructive ? 'text-destructive' : ''
                    }`}
                  >
                    <item.icon size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => setMessageMenuId(null)}
                  className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground mt-1"
                >
                  <span className="text-sm font-medium">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <ModelSelectorModal
          isOpen={showModelSelector}
          onClose={() => setShowModelSelector(false)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </div>
    </>
  );
};

// ─── User Bubble ──────────────────────────────────────────────────────────────
interface UserBubbleProps {
  message: Message;
  isEditing: boolean;
  editingDraft: string;
  setEditingDraft: (v: string) => void;
  onSubmitEdit: () => void;
  onCancelEdit: () => void;
  onLongPress: () => void;
}

const UserBubble = ({
  message, isEditing, editingDraft, setEditingDraft, onSubmitEdit, onCancelEdit, onLongPress,
}: UserBubbleProps) => {
  const longPressTimer = useRef<number | null>(null);
  const movedRef = useRef(false);

  const onTouchStart = () => {
    movedRef.current = false;
    longPressTimer.current = window.setTimeout(() => {
      if (!movedRef.current) onLongPress();
    }, 500);
  };
  const onTouchMove = () => {
    movedRef.current = true;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const onTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const onContextMenu = (e: React.MouseEvent) => { e.preventDefault(); onLongPress(); };

  if (isEditing) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div style={{
          background: 'hsl(var(--primary) / 0.08)',
          border: '1px solid hsl(var(--primary) / 0.3)',
          borderRadius: '18px 18px 4px 18px',
          padding: '12px 14px',
          maxWidth: '85%',
          width: '100%',
        }}>
          <textarea
            value={editingDraft}
            onChange={(e) => setEditingDraft(e.target.value)}
            autoFocus
            rows={Math.min(8, Math.max(2, editingDraft.split('\n').length))}
            className="w-full bg-transparent outline-none resize-none text-foreground text-sm"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={onCancelEdit} className="rounded-lg h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={onSubmitEdit} className="rounded-lg h-8 text-xs">Save & regenerate</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 justify-end">
      <div
        className="san-bubble-user"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={onContextMenu}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content.split('[Attached Files]')[0]}
        </p>
        {message.metadata?.files && (
          <div className="mt-2 space-y-2">
            {message.metadata.files.map((file: any, idx: number) => (
              <div key={idx} className="san-bubble-attachment">
                <Paperclip size={13} />
                <span className="flex-1 truncate text-xs">{file.name}</span>
                <span className="text-xs opacity-70">{(file.size / 1024).toFixed(1)}KB</span>
              </div>
            ))}
          </div>
        )}
        {message.edited_at && (
          <p className="san-edited-badge">Edited</p>
        )}
      </div>
    </div>
  );
};
