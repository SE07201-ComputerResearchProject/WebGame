import GameCard from "./GameCard";
import { Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const GameGrid = () => {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getGames();
        if (mounted && res?.ok) setGames(res.games || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-20 relative">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/50 -z-10" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">
                Thư viện Game
              </h2>
              <p className="text-muted-foreground mt-1">
                Khám phá các tựa game hot nhất
              </p>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="hidden md:flex items-center gap-2">
            <FilterTab label="Tất cả" active />
            <FilterTab label="Miễn phí" />
            <FilterTab label="Mới nhất" />
            <FilterTab label="Phổ biến" />
          </div>
        </div>

        {/* Game Grid - Compact Layout 5-6 per row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {games.map((game) => (
            <GameCard 
              key={game.id} 
              {...game}
              isCompact
            />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-xl font-display font-semibold text-muted-foreground border border-border/50 hover:border-primary/50 hover:text-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
            Xem thêm game
          </button>
        </div>
      </div>
    </section>
  );
};

const FilterTab = ({ label, active }: { label: string; active?: boolean }) => (
  <button
    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
      active
        ? "bg-primary/20 text-primary border border-primary/30"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`}
  >
    {label}
  </button>
);

export default GameGrid;
