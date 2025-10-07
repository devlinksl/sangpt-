import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Calculator } from 'lucide-react';

export default function MathSolver() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Math Solver</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Calculator className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Advanced Math Solver</CardTitle>
            <CardDescription>Solve complex mathematical problems with step-by-step solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Math solving capabilities coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
