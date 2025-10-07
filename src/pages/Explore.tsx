import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ImageIcon, Globe, Mic, Gamepad2, BookOpen, Code, Sparkles } from 'lucide-react';

import { Mail, Video, Share2, Languages, Calculator, BarChart3, FileText, Briefcase, Search, Music, ChefHat, Dumbbell } from 'lucide-react';

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
  },
  {
    icon: Mail,
    title: 'Email Writer',
    description: 'Compose professional emails effortlessly',
    color: 'from-yellow-500 to-orange-500',
    path: '/email-writer'
  },
  {
    icon: Video,
    title: 'Video Script',
    description: 'Create engaging video scripts',
    color: 'from-red-500 to-pink-500',
    path: '/video-script'
  },
  {
    icon: Share2,
    title: 'Social Media Post',
    description: 'Generate viral social media content',
    color: 'from-blue-500 to-purple-500',
    path: '/social-media-post'
  },
  {
    icon: Languages,
    title: 'Language Translator',
    description: 'Translate text between 100+ languages',
    color: 'from-green-500 to-teal-500',
    path: '/language-translator'
  },
  {
    icon: Calculator,
    title: 'Math Solver',
    description: 'Solve complex math problems step-by-step',
    color: 'from-cyan-500 to-blue-500',
    path: '/math-solver'
  },
  {
    icon: BarChart3,
    title: 'Data Analyzer',
    description: 'Analyze and visualize your data',
    color: 'from-indigo-500 to-blue-500',
    path: '/data-analyzer'
  },
  {
    icon: FileText,
    title: 'Resume Builder',
    description: 'Create professional ATS-friendly resumes',
    color: 'from-purple-500 to-indigo-500',
    path: '/resume-builder'
  },
  {
    icon: Briefcase,
    title: 'Business Plan',
    description: 'Generate comprehensive business plans',
    color: 'from-gray-600 to-gray-800',
    path: '/business-plan'
  },
  {
    icon: Search,
    title: 'SEO Optimizer',
    description: 'Optimize content for search engines',
    color: 'from-lime-500 to-green-500',
    path: '/seo-optimizer'
  },
  {
    icon: Music,
    title: 'Music Composer',
    description: 'Generate original music compositions',
    color: 'from-violet-500 to-purple-500',
    path: '/music-composer'
  },
  {
    icon: ChefHat,
    title: 'Recipe Generator',
    description: 'Create delicious recipes from ingredients',
    color: 'from-amber-500 to-orange-500',
    path: '/recipe-generator'
  },
  {
    icon: Dumbbell,
    title: 'Fitness Planner',
    description: 'Get personalized workout plans',
    color: 'from-red-500 to-orange-500',
    path: '/fitness-planner'
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
