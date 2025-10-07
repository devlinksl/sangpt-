import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Languages } from 'lucide-react';

export default function LanguageTranslator() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Language Translator</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Languages className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Multi-Language Translator</CardTitle>
            <CardDescription>Translate text between 100+ languages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Translation service coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
