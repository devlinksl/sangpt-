import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type Status = 'checking' | 'online' | 'offline' | 'paused';

export const ConnectivityBanner = () => {
  const [status, setStatus] = useState<Status>('checking');
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkConnectivity = useCallback(async () => {
    setChecking(true);
    try {
      // Try a lightweight auth call to check if backend is reachable
      const start = Date.now();
      const { error } = await supabase.auth.getSession();
      const duration = Date.now() - start;

      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        // Paused projects often return specific errors or timeout
        if (
          msg.includes('project has been paused') ||
          msg.includes('project is paused') ||
          msg.includes('service_unavailable')
        ) {
          setStatus('paused');
        } else {
          // Other errors might still mean we're connected
          setStatus('online');
        }
      } else {
        // If response took too long, might be network issues
        if (duration > 10000) {
          setStatus('offline');
        } else {
          setStatus('online');
        }
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('load failed') ||
        msg.includes('err_tunnel')
      ) {
        setStatus('offline');
      } else if (
        msg.includes('paused') ||
        msg.includes('service_unavailable')
      ) {
        setStatus('paused');
      } else {
        setStatus('offline');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    // Re-check every 30 seconds while offline/paused
    const interval = setInterval(() => {
      if (status === 'offline' || status === 'paused' || status === 'checking') {
        checkConnectivity();
      }
    }, 30000);

    // Also check on window focus
    const handleFocus = () => {
      if (status !== 'online') {
        checkConnectivity();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkConnectivity, status]);

  // Don't show banner if online or dismissed
  if (status === 'online' || status === 'checking' || dismissed) {
    return null;
  }

  const isPaused = status === 'paused';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isPaused ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <p className="font-medium">
            {isPaused
              ? 'Backend is paused due to inactivity'
              : "Can't connect to backend"}
          </p>
          <p className="text-sm opacity-90">
            {isPaused ? (
              <>
                Your project was paused after being inactive. Open the{' '}
                <strong>Cloud Dashboard</strong> to restore it.
              </>
            ) : (
              <>
                Please check your internet connection. If you're using a{' '}
                <strong>VPN</strong>, <strong>Private DNS</strong>, or{' '}
                <strong>ad-blocker</strong>, try disabling it temporarily.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={checkConnectivity}
            disabled={checking}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
            Retry
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 text-destructive-foreground hover:bg-destructive-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
