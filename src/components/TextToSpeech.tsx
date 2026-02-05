import { useState } from 'react';
import { Button } from '@/components/ui/button';
 import { useAlert } from '@/hooks/useAlert';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TextToSpeechProps {
  text: string;
  disabled?: boolean;
}

export const TextToSpeech = ({ text, disabled }: TextToSpeechProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
   const { alert } = useAlert();

  const speakText = async () => {
    if (!text.trim()) return;

    try {
      setIsPlaying(true);

      // Try browser's built-in speech synthesis first
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Natural') ||
          voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
           alert({
            title: "Speech Error",
            description: "Could not play audio. Please try again.",
            variant: "destructive",
          });
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback to edge function (placeholder for now)
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text, voice: 'alloy' }
        });

        if (error) throw error;

        if (data.fallback) {
           alert({
            title: "Speech Synthesis",
            description: "Text-to-speech is not available in this browser",
            variant: "destructive",
          });
        }
        setIsPlaying(false);
      }

    } catch (error) {
      console.error('Error with text-to-speech:', error);
       alert({
        title: "Speech Error",
        description: "Could not generate speech",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleClick = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      speakText();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={disabled || !text.trim()}
      className={`h-8 w-8 ${isPlaying ? 'text-blue-500' : ''}`}
    >
      {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
};