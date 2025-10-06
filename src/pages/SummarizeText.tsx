import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function SummarizeText() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Please enter text to summarize", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsSummarizing(true);
    setSummary('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Summarize the following text in a clear, concise manner. Highlight the main points and key takeaways:\n\n${text}` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to summarize text');
      setSummary(data.response);
      toast({ title: "Success", description: "Text summarized!" });
    } catch (error: any) {
      console.error('Summarization error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Summarize Text</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <h2 className="text-2xl font-bold mb-2">Summarize Any Text</h2>
          <p className="text-muted-foreground">Get concise summaries of long documents</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here... (articles, documents, etc.)"
            className="min-h-[200px] resize-none"
          />
          
          <Button 
            onClick={handleSummarize} 
            disabled={isSummarizing || !text.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isSummarizing ? 'Summarizing...' : 'Summarize'}
          </Button>
        </div>

        {isSummarizing && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {summary && !isSummarizing && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
