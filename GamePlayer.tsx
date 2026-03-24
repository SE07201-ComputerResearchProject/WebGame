import { useEffect, useRef, useState } from "react";

const GamePlayer = () => {
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Nhận event từ GameCard khi bấm PLAY
  useEffect(() => {
    type PlayGameEvent = CustomEvent<{ gameUrl: string }>;

    const handler = (e: PlayGameEvent) => {
      setGameUrl(e.detail.gameUrl);
    };

    window.addEventListener("playGame", handler);
    return () => window.removeEventListener("playGame", handler);
  }, []);

  // ESC để thoát game
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGameUrl(null);
    };

    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const closeGame = () => setGameUrl(null);

  const fullscreenGame = () => {
    if (playerRef.current?.requestFullscreen) {
      playerRef.current.requestFullscreen();
    }
  };

  if (!gameUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">

      {/* KHUNG NEON GAMING */}
      <div
        ref={playerRef}
        className="relative w-[1000px] h-[600px] bg-black rounded-2xl border border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.6),0_0_60px_rgba(0,255,255,0.3)] overflow-hidden"
      >

        {/* NÚT PHÓNG TO */}
        <button
          onClick={fullscreenGame}
          className="absolute top-3 left-3 z-50 px-4 py-2 bg-white text-black rounded-lg font-bold hover:scale-105 transition"
        >
          Phóng to
        </button>

        {/* NÚT ĐÓNG */}
        <button
          onClick={closeGame}
          className="absolute top-3 right-3 z-50 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:scale-105 transition"
        >
          X
        </button>

        {/* VIỀN SÁNG XUNG QUANH */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-400 opacity-40 pointer-events-none" />

        {/* GAME */}
        <iframe
          src={gameUrl}
          className="w-full h-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default GamePlayer;