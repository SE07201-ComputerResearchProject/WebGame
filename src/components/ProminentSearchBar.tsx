import { useState } from "react";
import { Search, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProminentSearchBarProps {
  onSearch?: (query: string) => void;
}

const ProminentSearchBar = ({ onSearch }: ProminentSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ⚠️ SECURITY WARNING: This input is vulnerable to XSS/SQLi for demo purposes
    // In production: ALWAYS sanitize and validate user input
    // Use parameterized queries for database operations
    // Escape HTML entities before rendering user input
    onSearch?.(query);
  };

  return (
    <section className="relative py-8 -mt-24 z-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Security Demo Notice */}
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-neon-orange">
            <AlertTriangle className="w-3 h-3" />
            <span className="opacity-70">Demo: Input này có thể bị tấn công XSS/SQLi</span>
          </div>

          {/* Search Bar Container */}
          <form 
            onSubmit={handleSubmit}
            className={`relative transition-all duration-500 ${
              isFocused 
                ? 'scale-[1.02] shadow-[0_0_60px_hsl(var(--primary)/0.4)]' 
                : 'shadow-[0_0_30px_hsl(var(--primary)/0.2)]'
            }`}
          >
            {/* Glow Effect Background */}
            <div className={`absolute -inset-1 rounded-2xl bg-gradient-gaming opacity-75 blur-lg transition-opacity duration-500 ${
              isFocused ? 'opacity-100' : 'opacity-50'
            }`} />
            
            {/* Main Search Input */}
            <div className="relative flex items-center gap-4 p-2 rounded-2xl bg-card/95 backdrop-blur-xl border-2 border-primary/50">
              {/* Search Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 ml-2">
                <Search className={`w-6 h-6 transition-colors duration-300 ${
                  isFocused ? 'text-primary' : 'text-primary/70'
                }`} />
              </div>
              
              {/* Input Field */}
              <input
                type="text"
                placeholder="Tìm kiếm game, thể loại, nhà phát triển..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 h-14 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                // ⚠️ DEMO: No input sanitization for security testing
              />
              
              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              {/* Search Button */}
              <Button 
                type="submit" 
                variant="gaming" 
                size="lg"
                className="h-12 px-8 mr-1 text-base font-semibold"
              >
                Tìm kiếm
              </Button>
            </div>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="text-sm text-muted-foreground">Phổ biến:</span>
            {['RPG', 'Bắn súng', 'Đua xe', 'Puzzle', 'Đối kháng'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 text-sm font-medium rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border/50 hover:border-primary/50 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProminentSearchBar;
