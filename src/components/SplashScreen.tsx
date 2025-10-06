import { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + 5;
      });
    }, 95); // 1900ms / 20 steps = 95ms per step

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <img
            src="/loader-img.jpg"
            alt="SanGPT Logo"
            className="w-32 h-32 object-contain animate-scale-in"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-32 h-32 flex items-center justify-center text-white text-6xl font-bold bg-gradient-to-br from-white/20 to-white/10 rounded-2xl';
                fallback.textContent = 'S';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
      </div>
      
      <div className="mt-8 w-64">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300 shadow-lg shadow-white/50"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/80 text-sm text-center mt-3 font-medium">Loading SanGPT...</p>
      </div>
    </div>
  );
};
