import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewChat = () => {
    // This will be handled by ChatInterface's startNewChat function
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <ChatInterface onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
      />
    </div>
  );
};

export default Index;