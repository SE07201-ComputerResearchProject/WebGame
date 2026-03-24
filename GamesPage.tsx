import { useEffect,useState } from "react";
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
    <div className="min-h-screen bg-background">
      <Navbar
        onAuthClick={() => setIsAuthOpen(true)}
        onWalletClick={() => setIsWalletOpen(true)}
      />
      <main className="pt-16">
        <ProminentSearchBar onSearch={(q) => console.log("Search:", q)} />
        <GameGrid />
      </main>
      <Footer />
      <FloatingChatWidget />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
        {gameFrame && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

    <div className="relative w-[900px] h-[550px] bg-black rounded-xl overflow-hidden">

      <button
        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
        onClick={() => setGameFrame(null)}
      >
        X
      </button>

      <iframe
        src={gameFrame}
        className="w-full h-full"
      />

    </div>

  </div>
)}
    </div>
  );
};

export default GamesPage;
