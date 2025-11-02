import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';

const Index = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Handle navigation from text selection page
  useEffect(() => {
    if (location.state?.conversationId) {
      setSelectedConversationId(location.state.conversationId);
    }
  }, [location.state]);

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
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