import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Mail } from 'lucide-react';

export default function EmailWriter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Email Writer</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Mail className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Professional Email Writer</CardTitle>
            <CardDescription>Generate professional emails for any occasion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Email writing assistance coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
