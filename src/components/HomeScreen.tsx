import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRipple } from '@/hooks/useRipple';
import {
  Lightbulb,
  Code,
  Wand2,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Shield,
  Mic,
  Briefcase,
  Palette,
  Brain,
  ArrowRight,
} from 'lucide-react';

interface HomeScreenProps {
  onPromptSelect: (text: string) => void;
  onConversationSelect: (id: string) => void;
  user: any;
}

// ── Starter prompt cards with expandable sub-prompts ──
const PROMPT_CATEGORIES = [
  {
    icon: Lightbulb,
    category: 'Learn',
    text: "Explain quantum computing like I'm 5",
    subPrompts: [
      "What are black holes made of?",
      "Teach me about machine learning basics",
      "How does the internet actually work?",
    ],
  },
  {
    icon: Code,
    category: 'Code',
    text: 'Write a Python script to analyze CSV data',
    subPrompts: [
      "Build a REST API with Node.js",
      "Debug this React component for me",
      "Create a SQL query for sales reports",
    ],
  },
  {
    icon: Wand2,
    category: 'Create',
    text: 'Help me brainstorm creative project ideas',
    subPrompts: [
      "Write a short story about time travel",
      "Design a logo concept for my startup",
      "Generate social media captions",
    ],
  },
  {
    icon: Sparkles,
    category: 'Advice',
    text: 'Suggest ways to improve my productivity',
    subPrompts: [
      "How should I prepare for a job interview?",
      "Give me tips for public speaking",
      "Help me plan my weekly schedule",
    ],
  },
];

// ── AI Modes ──
const AI_MODES = [
  { id: 'general', label: 'General', icon: Brain },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'business', label: 'Business', icon: Briefcase },
];

// ── Daily tips pool ──
const DAILY_TIPS = [
  "💡 Try starting with \"Imagine\" to generate AI images instantly.",
  "💡 Use Shift+Enter for multi-line messages without sending.",
  "💡 Pin important conversations in the sidebar for quick access.",
  "💡 Switch to Code mode for better programming responses.",
  "💡 Ask SanGPT to \"explain like I'm 5\" for simpler explanations.",
  "💡 You can attach files and images directly in your messages.",
  "💡 Use the Explore tab to discover specialized AI tools.",
];

// ── Rotating taglines ──
const TAGLINES = [
  "Built for productivity",
  "Your AI, your control",
  "Enterprise-ready intelligence",
  "Think smarter, move faster",
  "AI that adapts to you",
];

interface RecentConversation {
  id: string;
  title: string;
  updated_at: string;
}

export const HomeScreen = ({ onPromptSelect, onConversationSelect, user }: HomeScreenProps) => {
  const navigate = useNavigate();
  const createRipple = useRipple();
  const [showBrandIntro, setShowBrandIntro] = useState(true);
  const [brandFadeOut, setBrandFadeOut] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState('general');
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);

  // ── Time-based greeting ──
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
    const nameStr = name ? `, ${name}` : '';

    if (hour >= 5 && hour < 12) return `Good morning${nameStr}`;
    if (hour >= 12 && hour < 17) return `Good afternoon${nameStr}`;
    return `Good evening${nameStr}`;
  }, [user]);

  // ── Daily tip (changes per session using sessionStorage) ──
  const dailyTip = useMemo(() => {
    const stored = sessionStorage.getItem('sangpt-tip-index');
    if (stored !== null) return DAILY_TIPS[parseInt(stored) % DAILY_TIPS.length];
    const idx = Math.floor(Math.random() * DAILY_TIPS.length);
    sessionStorage.setItem('sangpt-tip-index', String(idx));
    return DAILY_TIPS[idx];
  }, []);

  // ── Brand intro animation (once per session) ──
  useEffect(() => {
    const seen = sessionStorage.getItem('sangpt-brand-intro');
    if (seen) {
      setShowBrandIntro(false);
      return;
    }
    const fadeTimer = setTimeout(() => setBrandFadeOut(true), 1500);
    const hideTimer = setTimeout(() => {
      setShowBrandIntro(false);
      sessionStorage.setItem('sangpt-brand-intro', '1');
    }, 2000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // ── Rotating tagline ──
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFading(true);
      setTimeout(() => {
        setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
        setTaglineFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch recent conversations ──
  useEffect(() => {
    if (!user) return;
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);
      if (data) setRecentConversations(data);
    };
    fetchRecent();
  }, [user]);

  // ── Card toggle ──
  const toggleCard = (index: number) => {
    setExpandedCard(prev => (prev === index ? null : index));
  };

  // ── Brand intro overlay ──
  if (showBrandIntro) {
    return (
      <div className={`flex flex-col items-center justify-center h-full transition-opacity duration-500 ${brandFadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground animate-fade-in">
          SanGPT
        </h1>
        <p className="text-lg text-muted-foreground mt-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Your AI Assistant
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full px-4 overflow-y-auto overscroll-contain pb-8">
      <div className="max-w-3xl mx-auto w-full space-y-6 py-12 md:py-16 animate-fade-in">

        {/* ── Brand + Greeting ── */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">SanGPT</h1>
          <p className={`text-sm text-muted-foreground/70 transition-opacity duration-300 ${taglineFading ? 'opacity-0' : 'opacity-100'}`}>
            {TAGLINES[taglineIndex]}
          </p>
          <p className="text-lg text-muted-foreground mt-2">{greeting}</p>
        </div>

        {/* ── AI Mode Selector ── */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {AI_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-card/40 text-muted-foreground border-border/30 hover:bg-card/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* ── Expandable Prompt Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {PROMPT_CATEGORIES.map((prompt, i) => {
            const Icon = prompt.icon;
            const isExpanded = expandedCard === i;
            return (
              <div key={i} className="flex flex-col">
                <button
                  onClick={(e) => { createRipple(e); toggleCard(i); }}
                  className="p-4 rounded-xl border border-border/30 bg-card/50 backdrop-blur-xl hover:bg-card/70 transition-all flex flex-col items-start gap-2 text-left group shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{prompt.category}</span>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-sm text-foreground">{prompt.text}</p>
                </button>

                {/* Expanded sub-prompts */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-48 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-1.5 pl-2">
                    {prompt.subPrompts.map((sub, j) => (
                      <button
                        key={j}
                        onClick={(e) => { createRipple(e); onPromptSelect(sub); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors border border-border/20 bg-card/30 backdrop-blur-sm"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recent Conversations ── */}
        {user && recentConversations.length > 0 && (
          <div className="max-w-2xl mx-auto w-full space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Continue where you left off
            </h3>
            <div className="space-y-1.5">
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onConversationSelect(conv.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card/40 backdrop-blur-sm border border-border/20 hover:bg-card/60 transition-all text-left group"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{conv.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily AI Tip ── */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="px-4 py-3 rounded-xl bg-card/30 backdrop-blur-sm border border-border/20 text-center">
            <p className="text-xs text-muted-foreground">{dailyTip}</p>
          </div>
        </div>

        {/* ── Voice Input Hint + License Trust ── */}
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-muted-foreground/50">
            <Mic className="h-3.5 w-3.5" />
            <span className="text-[10px]">Voice input available</span>
          </div>
          <button
            onClick={() => navigate('/license')}
            className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="text-[10px]">Licensed & Secure</span>
          </button>
        </div>

      </div>
    </div>
  );
};
