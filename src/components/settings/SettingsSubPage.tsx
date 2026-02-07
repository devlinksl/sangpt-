import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface SettingsSubPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function SettingsSubPage({ title, onBack, children }: SettingsSubPageProps) {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 bg-background/50 backdrop-blur-2xl backdrop-saturate-150 border-b border-border/20 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto p-4 space-y-6 pb-12">
        {children}
      </div>
    </div>
  );
}
