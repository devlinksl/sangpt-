import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TextToSpeech } from '@/components/TextToSpeech';
import { 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  Copy,
  Check,
  Share2
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

  const handleRating = async (newRating: number) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('messages')
        .update({ rating: newRating })
        .eq('id', messageId);
      if (error) throw error;
      onRatingChange?.(newRating);
    } catch (error) {
      console.error('Error updating rating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  if (role !== 'assistant') return null;

  return (
    <div className="flex items-center gap-0.5 pt-1 actions-reveal">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleRating(rating === 1 ? 0 : 1)}
        disabled={isLoading}
        className={`h-8 w-8 rounded-lg action-stagger ${rating === 1 ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
        style={{ animationDelay: '0ms' }}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleRating(rating === -1 ? 0 : -1)}
        disabled={isLoading}
        className={`h-8 w-8 rounded-lg action-stagger ${rating === -1 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}
        style={{ animationDelay: '60ms' }}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-8 w-8 rounded-lg text-muted-foreground action-stagger"
        style={{ animationDelay: '120ms' }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRegenerate?.()}
        disabled={isLoading}
        className="h-8 w-8 rounded-lg text-muted-foreground action-stagger"
        style={{ animationDelay: '180ms' }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>

      <span className="action-stagger" style={{ animationDelay: '240ms' }}>
        <TextToSpeech text={content} disabled={isLoading} />
      </span>

      {navigator.share && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-8 w-8 rounded-lg text-muted-foreground action-stagger"
          style={{ animationDelay: '300ms' }}
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
