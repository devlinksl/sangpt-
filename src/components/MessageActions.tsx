import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TextToSpeech } from '@/components/TextToSpeech';
import { 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  Copy,
  Check
} from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  rating: number;
  onRegenerate?: () => void;
  onRatingChange?: (rating: number) => void;
}

export const MessageActions = ({ 
  messageId, 
  content, 
  role, 
  rating,
  onRegenerate,
  onRatingChange 
}: MessageActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleRating = async (newRating: number) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('messages')
        .update({ rating: newRating })
        .eq('id', messageId);

      if (error) throw error;

      onRatingChange?.(newRating);
      
      toast({
        title: newRating === 1 ? "Liked" : "Disliked",
        description: "Thank you for your feedback!",
      });

    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: "Error",
        description: "Could not save your feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    onRegenerate?.();
  };

  // Only show actions for assistant messages
  if (role !== 'assistant') return null;

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleRating(rating === 1 ? 0 : 1)}
        disabled={isLoading}
        className={`h-8 w-8 ${rating === 1 ? 'text-green-600 bg-green-50' : ''}`}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleRating(rating === -1 ? 0 : -1)}
        disabled={isLoading}
        className={`h-8 w-8 ${rating === -1 ? 'text-red-600 bg-red-50' : ''}`}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRegenerate}
        disabled={isLoading}
        className="h-8 w-8"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <TextToSpeech text={content} disabled={isLoading} />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-8 w-8"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};