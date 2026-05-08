import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';
import { useChatAppearance } from '@/hooks/useChatAppearance';

const SIDEBAR_WIDTH = 320;
const EDGE_GRAB_PX = 28; // distance from left edge that initiates open-drag
const OPEN_THRESHOLD_RATIO = 0.4; // 40% of screen width

const Index = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [backdropOpacity, setBackdropOpacity] = useState<number | undefined>(undefined);

  // Apply chat appearance preferences globally
  useChatAppearance();

  useEffect(() => {
    if (location.state?.conversationId) {
      setSelectedConversationId(location.state.conversationId);
    }
  }, [location.state]);

  const handleNewChat = useCallback(() => {
    setSelectedConversationId(null);
    setSidebarOpen(false);
  }, []);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
  }, []);

  // ─── Native finger-following drag gesture ───
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragModeRef = useRef<'opening' | 'closing' | null>(null);
  const lockedAxisRef = useRef<'h' | 'v' | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      lockedAxisRef.current = null;

      if (sidebarOpen) {
        dragModeRef.current = 'closing';
      } else if (t.clientX <= EDGE_GRAB_PX) {
        dragModeRef.current = 'opening';
      } else {
        dragModeRef.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragModeRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startXRef.current;
      const dy = t.clientY - startYRef.current;

      // Lock axis after small movement
      if (lockedAxisRef.current === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        lockedAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        if (lockedAxisRef.current === 'v') {
          dragModeRef.current = null;
          return;
        }
      }

      const W = SIDEBAR_WIDTH;
      if (dragModeRef.current === 'opening') {
        // Only positive (rightward) drag opens
        if (dx <= 0) { setDragOffset(0); setBackdropOpacity(0); return; }
        const offset = Math.min(dx, W); // 0..W
        setDragOffset(offset); // sidebar shows from -W + offset
        setBackdropOpacity(Math.min(1, offset / W));
      } else if (dragModeRef.current === 'closing') {
        // Only negative (leftward) drag closes
        if (dx >= 0) { setDragOffset(0); setBackdropOpacity(1); return; }
        const offset = Math.max(dx, -W); // -W..0
        setDragOffset(offset);
        setBackdropOpacity(Math.max(0, 1 + offset / W));
      }
    };

    const onTouchEnd = () => {
      if (!dragModeRef.current) {
        setDragOffset(null);
        setBackdropOpacity(undefined);
        return;
      }
      const W = SIDEBAR_WIDTH;
      const threshold = window.innerWidth * OPEN_THRESHOLD_RATIO;
      const offset = (typeof dragOffset === 'number' ? dragOffset : 0);

      if (dragModeRef.current === 'opening') {
        // offset is 0..W (how far user has dragged)
        if (offset >= threshold || offset >= W * 0.5) setSidebarOpen(true);
        else setSidebarOpen(false);
      } else if (dragModeRef.current === 'closing') {
        // offset is -W..0 (how far user has dragged left)
        if (Math.abs(offset) >= threshold || Math.abs(offset) >= W * 0.5) setSidebarOpen(false);
        else setSidebarOpen(true);
      }

      dragModeRef.current = null;
      lockedAxisRef.current = null;
      setDragOffset(null);
      setBackdropOpacity(undefined);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [sidebarOpen, dragOffset]);

  // Compute main-content shift/scale (ChatGPT-iOS feel)
  const W = SIDEBAR_WIDTH;
  let progress = sidebarOpen ? 1 : 0;
  if (dragOffset != null) {
    if (sidebarOpen) progress = Math.max(0, 1 + dragOffset / W);
    else progress = Math.max(0, Math.min(1, dragOffset / W));
  }
  const mainScale = 1 - progress * 0.06;
  const mainTranslate = progress * (W * 0.18);
  const mainRadius = progress * 18;

  return (
    <div className="min-h-screen bg-background chat-surface overflow-hidden">
      <div
        style={{
          transform: `translateX(${mainTranslate}px) scale(${mainScale})`,
          transformOrigin: 'left center',
          borderRadius: mainRadius ? `${mainRadius}px` : undefined,
          overflow: 'hidden',
          transition: dragOffset != null ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.28s',
          willChange: 'transform',
        }}
      >
        <ChatInterface
          onOpenSidebar={() => setSidebarOpen(true)}
          conversationId={selectedConversationId}
          onConversationChange={setSelectedConversationId}
        />
      </div>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onConversationSelect={handleConversationSelect}
        dragOffset={dragOffset}
        backdropOpacity={backdropOpacity}
      />
    </div>
  );
};

export default Index;
