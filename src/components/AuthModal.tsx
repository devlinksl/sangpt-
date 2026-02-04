import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Chrome } from 'lucide-react';
import { humanizeError } from '@/lib/humanizeError';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [view, setView] = useState<'main' | 'signin' | 'signup'>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You're now signed in",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: humanizeError(error) ?? error?.message ?? "Sign in failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "You can now start using the app",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: humanizeError(error) ?? error?.message ?? "Sign up failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign In Error",
        description: humanizeError(error) ?? error?.message ?? "Google sign-in failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md bottom-0 top-auto translate-y-0 slide-in-from-bottom animate-slide-in-bottom rounded-t-3xl rounded-b-none border-0 p-0">
        {/* Accessibility (prevents Radix warnings) */}
        <DialogTitle className="sr-only">
          {view === 'main' ? 'Authentication' : view === 'signin' ? 'Sign in' : 'Sign up'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Sign in or create an account to continue.
        </DialogDescription>
        {view === 'main' ? (
          <>
            <div className="px-6 pt-6 pb-2 flex justify-end">
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="px-6 pb-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Create an account for more</h2>
                <p className="text-muted-foreground">
                  Log in or sign up to access chat history, create images, and more.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleSignIn}
                  className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-base"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button 
                  onClick={() => setView('signup')}
                  variant="outline"
                  className="w-full h-14 rounded-full text-base border-2"
                >
                  Sign up
                </Button>

                <Button 
                  onClick={() => setView('signin')}
                  variant="outline"
                  className="w-full h-14 rounded-full text-base border-2"
                >
                  Log in
                </Button>
              </div>
            </div>
          </>
        ) : view === 'signin' ? (
          <>
            <div className="px-6 pt-6 pb-2 flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setView('main')} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold flex-1 text-center mr-10">Sign in</h2>
            </div>
            
            <form onSubmit={handleSignIn} className="px-6 pb-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => setView('signup')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="px-6 pt-6 pb-2 flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setView('main')} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold flex-1 text-center mr-10">Sign up</h2>
            </div>
            
            <form onSubmit={handleSignUp} className="px-6 pb-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => setView('signin')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};