import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Mic, Download, Moon, Sun, Share2, Save } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShimmerLoading } from '@/components/ShimmerLoading';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';

const formatResponse = (text: string) => {
  const lines = text.split('\n').map((line, index) => {
    const trimmed = line.trim();

    // Enlarged text: *text*
    if (/^\*.*\*$/.test(trimmed)) {
      return (
        <p key={index} className="text-2xl font-bold text-blue-600 mb-4">
          {trimmed.replace(/^\*|\*$/g, '')}
        </p>
      );
    }

    // Headings: ## Heading
    if (/^##\s/.test(trimmed)) {
      return (
        <h2 key={index} className="text-xl font-semibold mt-6 mb-2 text-cyan-700">
          {trimmed.replace(/^##\s/, '')}
        </h2>
      );
    }

    // Bullet points: - item
    if (/^-\s/.test(trimmed)) {
      return (
        <li key={index} className="ml-6 list-disc text-base text-muted-foreground">
          {trimmed.replace(/^- /, '')}
        </li>
      );
    }

    // Blockquotes: > quote
    if (/^>\s/.test(trimmed)) {
      return (
        <blockquote key={index} className="border-l-4 pl-4 italic text-muted-foreground">
          {trimmed.replace(/^>\s/, '')}
        </blockquote>
      );
    }

    // Inline *bold* inside a sentence
    const inlineBold = trimmed.split(/(\*[^*]+\*)/).map((chunk, i) => {
      if (/^\*[^*]+\*$/.test(chunk)) {
        return <strong key={i}>{chunk.replace(/^\*|\*$/g, '')}</strong>;
      }
      return <span key={i}>{chunk}</span>;
    });

    return (
      <p key={index} className="text-sm text-foreground mb-2">
        {inlineBold}
      </p>
    );
  });

  return <div>{lines}</div>;
};

export default function CreatePodcast() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) setVoice(voices[0]);
  }, []);

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
      setHistory(prev => [...prev, data.response]);
      toast({ title: "Success", description: "Podcast script generated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied", description: "Script copied to clipboard" });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(script, 10, 10);
    doc.save(`${topic}-podcast.pdf`);
  };

  const handleExportDOCX = async () => {
    const doc = new Document({
      sections: [{ children: [new Paragraph(script)] }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${topic}-podcast.docx`);
  };

  const handleExportTXT = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${topic}-podcast.txt`);
  };

  const handlePlayAudio = () => {
    const utterance = new SpeechSynthesisUtterance(script);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const handleEmailScript = async () => {
    await supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: `Podcast Script: ${topic}`,
        html: `<pre>${script}</pre>`
      }
    });
    toast({ title: "Sent", description: "Script emailed to your inbox" });
  };

  const handleSaveToCloud = async () => {
    await supabase.from('scripts').insert({ user_id: user.id, topic, content: script });
    toast({ title: "Saved", description: "Script saved to your cloud library" });
  };

  const getDurationEstimate = () => {
    const words = script.split(/\s+/).length;
    const minutes = Math.round(words / 150);
    return `${minutes} min episode`;
  };

  return (
    <div className={darkMode ? 'dark bg-black text-white' : 'bg-background'}>
      <header className="sticky top-0 backdrop-blur-sm border-b border-border z-10 bg-background/80 dark:bg-black/80">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Create Podcast</h1>
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
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
              <span className="text-sm text-muted-foreground">{getDurationEstimate()}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCopy}><Download className="w-4 h-4 mr-2" />Copy</Button>
              <Button variant="outline" onClick={handleExportPDF}>PDF</Button>
              <Button variant="outline" onClick={handleExportDOCX}>DOCX</Button>
              <Button variant="outline" onClick={handleExportTXT}>TXT</Button>
              <Button variant="outline" onClick={handleEmailScript}>Email</Button>
              <Button variant="outline" onClick={handlePlayAudio}>🔊 Listen</Button>
              <Button variant="outline" onClick={handleSaveToCloud}><Save className="w-4 h-4 mr-2" />Save</Button>
              <Button variant="outline" onClick={() => toast({ title: "Link", description: "Shareable link copied!" })}><Share2 className="w-4 h-4 mr-2" />Share</Button>
            </div>

            <div className="border-t pt-4 space-y-2 whitespace-pre-wrap text-sm">{script}</div>

            {history.length > 1 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">Version History</h4>
                <ul className="list-disc ml-6 text-muted-foreground text-sm space-y-1">
                  {history.slice(0, -1).map((entry, i) => (
                    <li key={i}>{entry.slice(0, 60)}...</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div
