import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Globe, Search } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
 import { useAlert } from '@/hooks/useAlert';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function DeepResearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
   const { alert } = useAlert();
  const [topic, setTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState('');

  const handleResearch = async () => {
    if (!topic.trim()) {
       alert({ title: "Error", description: "Please enter a research topic", variant: "destructive" });
      return;
    }

    if (!user) {
       alert({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsResearching(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Conduct comprehensive research on: ${topic}. Provide detailed information, key facts, recent developments, and relevant insights.` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to conduct research');
      setResult(data.response);
    } catch (error: any) {
      console.error('Research error:', error);
       alert({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Deep Research</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h2 className="text-2xl font-bold mb-2">Comprehensive Research</h2>
          <p className="text-muted-foreground">Get in-depth information on any topic</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to research... (e.g., 'Quantum Computing Applications')"
            className="min-h-[100px] resize-none"
          />
          
          <Button 
            onClick={handleResearch} 
            disabled={isResearching || !topic.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Search className="w-4 h-4 mr-2" />
            {isResearching ? 'Researching...' : 'Start Research'}
          </Button>
        </div>

        {isResearching && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {result && !isResearching && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Research Results</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
