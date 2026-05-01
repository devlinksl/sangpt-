import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';
import { useChatAppearance } from '@/hooks/useChatAppearance';

const Index = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Apply chat appearance preferences globally
  useChatAppearance();

  // Handle navigation from text selection page
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

  // ─── Native-like swipe gestures ───
  // Swipe right from left edge → open sidebar
  // Swipe left while sidebar open → close sidebar
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchActive = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX.current = t.clientX;
      touchStartY.current = t.clientY;
      // Only track edge swipes when closed; full-area when open
      const fromLeftEdge = t.clientX < 24;
      touchActive.current = sidebarOpen || fromLeftEdge;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchActive.current) return;
      touchActive.current = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      // Must be predominantly horizontal
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (!sidebarOpen && dx > 60) setSidebarOpen(true);
      else if (sidebarOpen && dx < -60) setSidebarOpen(false);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background chat-surface">
      <ChatInterface
        onOpenSidebar={() => setSidebarOpen(true)}
        conversationId={selectedConversationId}
        onConversationChange={setSelectedConversationId}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onConversationSelect={handleConversationSelect}
      />
    </div>
  );
};

export default Index;
