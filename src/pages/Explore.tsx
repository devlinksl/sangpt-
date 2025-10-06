import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ImageIcon, Globe, Mic, Gamepad2, BookOpen, Code, Sparkles } from 'lucide-react';

const features = [
  {
    icon: ImageIcon,
    title: 'Image Generation',
    description: 'Create stunning images from text descriptions',
    color: 'from-purple-500 to-pink-500',
    path: '/image-generation'
  },
  {
    icon: Globe,
    title: 'Deep Research',
    description: 'Get comprehensive research on any topic',
    color: 'from-blue-500 to-cyan-500',
    path: '/deep-research'
  },
  {
    icon: Mic,
    title: 'Create Podcast',
    description: 'Generate podcast scripts and content',
    color: 'from-green-500 to-emerald-500',
    path: '/create-podcast'
  },
  {
    icon: Gamepad2,
    title: 'Interactive Quiz',
    description: 'Test your knowledge with AI-generated quizzes',
    color: 'from-orange-500 to-red-500',
    path: '/interactive-quiz'
  },
  {
    icon: BookOpen,
    title: 'Summarize Text',
    description: 'Get concise summaries of long documents',
    color: 'from-indigo-500 to-purple-500',
    path: '/summarize-text'
  },
  {
    icon: Code,
    title: 'Code Helper',
    description: 'Get help with coding and debugging',
    color: 'from-teal-500 to-blue-500',
    path: '/code-helper'
  },
  {
    icon: Sparkles,
    title: 'Creative Writing',
    description: 'Generate stories, poems, and creative content',
    color: 'from-pink-500 to-rose-500',
    path: '/creative-writing'
  }
];

export default function Explore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Explore</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">What can I help with?</h2>
          <p className="text-muted-foreground">Discover powerful AI features to enhance your productivity</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(feature.path)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:scale-105 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
