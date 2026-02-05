import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ImageIcon, Wand2 } from 'lucide-react';
 import { useAlert } from '@/hooks/useAlert';
import { ShimmerLoading } from '@/components/ShimmerLoading';

export default function ImageGeneration() {
  const navigate = useNavigate();
   const { alert } = useAlert();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
       alert({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(
        `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      // Check if it's an image response (e.g. image/jpeg)
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.startsWith("image/")) {
        // Convert response to blob (binary image)
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImage(imageUrl);
         alert({ title: "Success", description: "Image generated successfully!", variant: "success" });
      } else {
        throw new Error("Unexpected response format (not an image)");
      }
    } catch (error) {
      console.error("Image generation error:", error);
       alert({
        title: "Error",
        description: "An error occurred during image generation.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Image Generation</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Body */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-8 text-center shadow-sm">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-bold mb-2">Create Stunning Images</h2>
          <p className="text-muted-foreground">
            Describe what you want to see, and AI will generate it for you.
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[120px] resize-none text-base"
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

        {/* Loading */}
        {isGenerating && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {/* Result */}
        {generatedImage && !isGenerating && (
          <div className="bg-card rounded-2xl p-4 animate-fade-in">
            <img
              src={generatedImage}
              alt="Generated result"
              className="w-full rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/fallback-image.png';
              }}
            />
            <div className="flex justify-center mt-4">
              <a
                href={generatedImage}
                download={`generated-${Date.now()}.jpg`}
                className="text-sm text-purple-500 underline hover:text-purple-600"
              >
                Download Image
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
        }
