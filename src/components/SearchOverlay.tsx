import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { getCachedConversations } from '@/lib/chatCache';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationSelect: (id: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  updated_at: string;
  snippet?: string;
}

export const SearchOverlay = ({ isOpen, onClose, onConversationSelect }: SearchOverlayProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTranslateX(0);
      setIsClosing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search from cache first
        const cached = await getCachedConversations(user.id);
        const q = query.toLowerCase();
        const cacheResults = cached
          .filter(c => c.title.toLowerCase().includes(q))
          .map(c => ({ id: c.id, title: c.title, updated_at: c.updated_at }));

        if (cacheResults.length > 0) {
          setResults(cacheResults);
        }

        // Also search server
        const { data } = await supabase
          .from('conversations')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .ilike('title', `%${query}%`)
          .order('updated_at', { ascending: false })
          .limit(20);

        if (data) setResults(data);
      } catch {
        // keep cache results
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx < 0) {
      currentXRef.current = dx;
      setTranslateX(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentXRef.current < -100) {
      setIsClosing(true);
      setTranslateX(-window.innerWidth);
      setTimeout(onClose, 250);
    } else {
      setTranslateX(0);
    }
    currentXRef.current = 0;
  }, [onClose]);

  const handleSelect = (id: string) => {
    onConversationSelect(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
      style={{
        transform: `translateX(${translateX}px)`,
        transition: currentXRef.current !== 0 && !isClosing ? 'none' : 'transform 0.25s cubic-bezier(0.2,0,0,1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all conversations..."
            className="pl-10 h-10 text-sm bg-accent/30 border-border/30 rounded-xl"
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        )}

        {!query && !isSearching && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Search your conversations</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Swipe left to close</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors text-left active:scale-[0.98]"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(result.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
