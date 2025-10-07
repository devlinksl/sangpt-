import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Briefcase } from 'lucide-react';

export default function BusinessPlan() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Business Plan</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Briefcase className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Business Plan Generator</CardTitle>
            <CardDescription>Create comprehensive business plans with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Business plan generation coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
