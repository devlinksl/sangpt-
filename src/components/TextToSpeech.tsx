import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { useSpeechPlayer } from '@/components/SpeechPlayer';

interface TextToSpeechProps {
  text: string;
  disabled?: boolean;
}

export const TextToSpeech = ({ text, disabled }: TextToSpeechProps) => {
  const { speak, isActive, isPlaying } = useSpeechPlayer();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Listen to this response"
      onClick={() => speak(text)}
      disabled={disabled || !text.trim()}
      className={`h-8 w-8 ${isActive && isPlaying ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      <Volume2 className="h-4 w-4" />
    </Button>
  );
};
