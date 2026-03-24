import GameCard from "./GameCard";
import { Gamepad2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type Game = {
  id: number;
  title: string;
  category: string;
  rating: number;
  players: number;
  image: string;
  game_url: string;
};

const GameGrid = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadGames = async () => {
      try {
       const res = await api.getGames();
console.log("API RESPONSE:", res);

        if (mounted && res?.ok && Array.isArray(res.games)) {
          setGames(res.games);
        } else {
          console.warn("API trả dữ liệu không đúng:", res);
          setGames([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải games:", error);
        setGames([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadGames();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* HEADER */}
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

          <div className="hidden md:flex items-center gap-2">
            <FilterTab label="Tất cả" active />
            <FilterTab label="Miễn phí" />
            <FilterTab label="Mới nhất" />
            <FilterTab label="Phổ biến" />
          </div>
        </div>

        {/* LOADING */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            Chưa có trò chơi nào được tải lên.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                category={game.category}
                rating={game.rating}
                players={game.players}
                image={game.image}
                gameUrl={game.game_url}
                isCompact
              />
            ))}
          </div>
        )}

        {/* LOAD MORE BUTTON */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-xl font-display font-semibold text-muted-foreground border border-border/50 hover:border-primary/50 hover:text-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
            Xem thêm game
          </button>
        </div>
      </div>
    </section>
  );
};

const FilterTab = ({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) => (
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