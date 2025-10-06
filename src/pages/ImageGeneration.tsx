import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ImageIcon, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function ImageGeneration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(`https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`);
      const data = await response.json();
      
      if (data.status && data.result?.images?.[0]) {
        setGeneratedImage(data.result.images[0]);
        toast({ title: "Success", description: "Image generated successfully!" });
      } else {
        toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
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
          <h1 className="text-lg font-semibold">Image Generation</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-8 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-bold mb-2">Create Stunning Images</h2>
          <p className="text-muted-foreground">Describe what you want to see, and AI will create it</p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate... (e.g., 'A serene sunset over mountains with a lake')"
            className="min-h-[120px] resize-none"
          />
          
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>

        {isGenerating && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {generatedImage && !isGenerating && (
          <div className="bg-card rounded-2xl p-4 animate-fade-in">
            <img src={generatedImage} alt="Generated" className="w-full rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
