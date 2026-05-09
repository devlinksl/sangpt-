import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';
import { useChatAppearance } from '@/hooks/useChatAppearance';

const SIDEBAR_WIDTH = 320;
const OPEN_THRESHOLD_RATIO = 0.35;
const VELOCITY_THRESHOLD = 0.5; // px/ms — flick to open/close

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

  // ─── Native finger-following drag gesture (swipe-from-anywhere + mouse) ───
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velRef = useRef(0);
  const dragModeRef = useRef<'opening' | 'closing' | null>(null);
  const activePointerRef = useRef<number | null>(null);

  useEffect(() => {
    const isInteractive = (el: EventTarget | null): boolean => {
      let n = el as HTMLElement | null;
      while (n && n !== document.body) {
        const tag = n.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || n.isContentEditable) return true;
        if (n.dataset && n.dataset.noSwipe === 'true') return true;
        n = n.parentElement;
      }
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isInteractive(e.target)) return;
      activePointerRef.current = e.pointerId;
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      lastTRef.current = performance.now();
      velRef.current = 0;
      dragModeRef.current = sidebarOpen ? 'closing' : 'opening';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointerRef.current !== e.pointerId || !dragModeRef.current) return;
      const dx = e.clientX - startXRef.current;
      const now = performance.now();
      const dt = Math.max(1, now - lastTRef.current);
      velRef.current = (e.clientX - lastXRef.current) / dt;
      lastXRef.current = e.clientX;
      lastTRef.current = now;

      const W = SIDEBAR_WIDTH;
      if (dragModeRef.current === 'opening') {
        if (dx <= 0) { setDragOffset(0); setBackdropOpacity(0); return; }
        const offset = Math.min(dx, W);
        setDragOffset(offset);
        setBackdropOpacity(Math.min(1, offset / W));
      } else {
        if (dx >= 0) { setDragOffset(0); setBackdropOpacity(1); return; }
        const offset = Math.max(dx, -W);
        setDragOffset(offset);
        setBackdropOpacity(Math.max(0, 1 + offset / W));
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      if (!dragModeRef.current) {
        setDragOffset(null); setBackdropOpacity(undefined); return;
      }
      const W = SIDEBAR_WIDTH;
      const threshold = window.innerWidth * OPEN_THRESHOLD_RATIO;
      const offset = (typeof dragOffset === 'number' ? dragOffset : 0);
      const v = velRef.current; // px/ms

      if (dragModeRef.current === 'opening') {
        if (v > VELOCITY_THRESHOLD || offset >= threshold) setSidebarOpen(true);
        else setSidebarOpen(false);
      } else {
        if (v < -VELOCITY_THRESHOLD || Math.abs(offset) >= threshold) setSidebarOpen(false);
        else setSidebarOpen(true);
      }

      dragModeRef.current = null;
      setDragOffset(null);
      setBackdropOpacity(undefined);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
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
