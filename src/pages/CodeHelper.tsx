import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Code, Terminal } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function CodeHelper() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [codeQuestion, setCodeQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');

  const handleAsk = async () => {
    if (!codeQuestion.trim()) {
      toast({ title: "Error", description: "Please enter your coding question", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setResponse('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Help me with this coding question or problem. Provide clear explanations and code examples if applicable:\n\n${codeQuestion}` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to get code help');
      setResponse(data.response);
    } catch (error: any) {
      console.error('Code help error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Code Helper</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-2xl p-8 text-center">
          <Code className="w-16 h-16 mx-auto mb-4 text-teal-500" />
          <h2 className="text-2xl font-bold mb-2">Code Helper</h2>
          <p className="text-muted-foreground">Get help with coding and debugging</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={codeQuestion}
            onChange={(e) => setCodeQuestion(e.target.value)}
            placeholder="Ask about code, debugging, algorithms, or paste your code for review..."
            className="min-h-[200px] resize-none font-mono text-sm"
          />
          
          <Button 
            onClick={handleAsk} 
            disabled={isProcessing || !codeQuestion.trim()}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
          >
            <Terminal className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Get Help'}
          </Button>
        </div>

        {isProcessing && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {response && !isProcessing && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Solution</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
