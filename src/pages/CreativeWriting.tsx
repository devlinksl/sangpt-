import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Sparkles, Feather } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function CreativeWriting() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a creative prompt", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setContent('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Create creative content based on this prompt. Be imaginative and engaging:\n\n${prompt}` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to generate creative content');
      setContent(data.response);
      toast({ title: "Success", description: "Content generated!" });
    } catch (error: any) {
      console.error('Creative writing error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Creative Writing</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl p-8 text-center">
          <Feather className="w-16 h-16 mx-auto mb-4 text-pink-500" />
          <h2 className="text-2xl font-bold mb-2">Creative Writing</h2>
          <p className="text-muted-foreground">Generate stories, poems, and creative content</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your creative prompt... (e.g., 'Write a short story about time travel')"
            className="min-h-[120px] resize-none"
          />
          
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Creating...' : 'Create Content'}
          </Button>
        </div>

        {isGenerating && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {content && !isGenerating && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Your Creative Content</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
