import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Mic, Download } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function CreatePodcast() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Error", description: "Please enter a podcast topic", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setScript('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Create a compelling podcast script about: ${topic}. Include an engaging introduction, main content points, and a strong conclusion. Format it for a 5-10 minute podcast episode.` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to generate podcast script');
      setScript(data.response);
      toast({ title: "Success", description: "Podcast script generated!" });
    } catch (error: any) {
      console.error('Podcast generation error:', error);
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
          <h1 className="text-lg font-semibold">Create Podcast</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 text-center">
          <Mic className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Create Podcast Scripts</h2>
          <p className="text-muted-foreground">Generate professional podcast content instantly</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter podcast topic... (e.g., 'The Future of Artificial Intelligence')"
            className="min-h-[100px] resize-none"
          />
          
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Script'}
          </Button>
        </div>

        {isGenerating && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {script && !isGenerating && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Podcast Script</h3>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(script);
                toast({ title: "Copied", description: "Script copied to clipboard" });
              }}>
                <Download className="w-4 h-4 mr-2" />
                Copy Script
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap border-t pt-4">
              {script}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
