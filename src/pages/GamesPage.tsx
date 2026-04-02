import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import GameGrid from "@/components/GameGrid";
import ProminentSearchBar from "@/components/ProminentSearchBar";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import Footer from "@/components/Footer"; 

const GamesPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [gameFrame, setGameFrame] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ gameUrl: string }>;
      console.log("PLAY GAME EVENT:", customEvent.detail);

      if (customEvent.detail?.gameUrl) {
        setGameFrame(customEvent.detail.gameUrl);
      }
    };

    window.addEventListener("playGame", handler);

    return () => {
      window.removeEventListener("playGame", handler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onAuthClick={() => setIsAuthOpen(true)}
        onWalletClick={() => setIsWalletOpen(true)}
      />
      
      {/* 🔴 ĐÃ SỬA: Tăng pt-16 thành pt-32 để đẩy nội dung xuống dưới Navbar */}
      <main className="flex-1 pt-40 pb-12 relative z-0">
        <div className="container mx-auto px-4">
          <ProminentSearchBar onSearch={(q) => console.log("Search:", q)} />
          
          {/* Thêm một khoảng cách nhỏ mt-8 giữa thanh tìm kiếm và lưới game cho thoáng màn hình */}
          <div className="mt-8">
            <GameGrid />
          </div>
        </div>
      </main>
      
      <Footer />
      <FloatingChatWidget />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      
      {/* Khung Game Iframe */}
      {gameFrame && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="relative w-[1000px] h-[600px] max-w-[95vw] max-h-[90vh] bg-zinc-950 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.15)] border border-white/10">
            
            {/* Nút X tắt game được thiết kế lại đẹp hơn */}
            <button
              className="absolute top-4 right-4 bg-rose-500 hover:bg-rose-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 transition-colors shadow-lg"
              onClick={() => setGameFrame(null)}
              title="Đóng game"
            >
              ✕
            </button>

            <iframe
              src={gameFrame}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;